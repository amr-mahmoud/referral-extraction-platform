import { Inject, Injectable, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { concatMap, filter } from 'rxjs/operators';
import { Clinic } from '../domain/clinic/clinic.aggregate';
import {
  ClinicInvalidCredentialsError,
  ClinicNotFoundError,
  ClinicUsernameTakenError,
} from '../domain/clinic/clinic.errors';
import { ExtractionSchemaNotFoundError } from '../domain/extraction-schema/extraction-schema.errors';
import { ExtractionSchema } from '../domain/extraction-schema/extraction-schema.aggregate';
import { Referral } from '../domain/referral/referral.aggregate';
import { BoundingBox } from '../domain/referral/bounding-box.value-object';
import { ExtractedField } from '../domain/referral/extracted-field.value-object';
import {
  ReferralNotFoundError,
  ReferralValidationError,
} from '../domain/referral/referral.errors';
import { ReferralStatus } from '../domain/referral/referral-status.value-object';
import { ReferralStatusValue } from '../domain/referral/types';
import { translateError } from './errors/application.exception';
import {
  CACHING_SERVICE_PORT,
  type CachingServicePort,
} from './ports/caching.port';
import {
  CLINIC_REPOSITORY_PORT,
  type ClinicRepositoryPort,
} from './ports/clinic-repository.port';
import { ENCRYPTION_PORT, type EncryptionPort } from './ports/encryption.port';
import {
  REFERRAL_NOTIFICATION_PORT,
  type ReferralNotificationPort,
} from './ports/referral-notification.port';
import {
  REFERRAL_REPOSITORY_PORT,
  type ReferralRepositoryPort,
} from './ports/referral-repository.port';
import { STORAGE_PORT, type StoragePort } from './ports/storage.port';
import { TOKEN_PORT, type TokenPort } from './ports/token.port';

// ── Command & result types — see ./types.ts ──────────────────────────

import type {
  AuthResult,
  CachedClinic,
  CachedReferral,
  CachingNewReferralsDataCommand,
  CreateExtractionSchemaCommand,
  CreateNewReferralsWithAttachedPresignedUrlsCommand,
  ExtractedFieldView,
  LoginCommand,
  ReferralData,
  ReferralListItem,
  ReferralStatusUpdateEvent,
  ReferralWithPresignedUpload,
  SignupCommand,
} from './types';

export type {
  AuthResult,
  CreateExtractionSchemaCommand,
  CreateNewReferralsWithAttachedPresignedUrlsCommand,
  ListReferralsQuery,
  LoginCommand,
  ReferralWithPresignedUpload,
  SignupCommand,
} from './types';

// ── Unified Application Service ──────────────────────────────────────

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  public constructor(
    @Inject(CLINIC_REPOSITORY_PORT)
    private readonly clinicRepository: ClinicRepositoryPort,
    @Inject(REFERRAL_REPOSITORY_PORT)
    private readonly referralRepository: ReferralRepositoryPort,
    @Inject(ENCRYPTION_PORT)
    private readonly encryptionService: EncryptionPort,
    @Inject(TOKEN_PORT)
    private readonly tokenService: TokenPort,
    @Inject(STORAGE_PORT)
    private readonly storageService: StoragePort,
    @Inject(CACHING_SERVICE_PORT)
    private readonly cachingService: CachingServicePort,
    @Inject(REFERRAL_NOTIFICATION_PORT)
    private readonly referralNotificationService: ReferralNotificationPort,
  ) {}

  // ── Auth ─────────────────────────────────────────────────────────

  public async signup(command: SignupCommand): Promise<AuthResult> {
    try {
      const existingClinic = await this.clinicRepository.findByUsername(
        command.username,
      );
      if (existingClinic) {
        throw new ClinicUsernameTakenError(command.username);
      }

      const hashedPassword = await this.encryptionService.hash(
        command.password,
      );

      const clinic = new Clinic({
        clinicName: command.clinicName,
        username: command.username,
        rawPassword: command.password,
        hashedPassword,
      });

      const savedClinic = await this.clinicRepository.save(clinic);

      const token = this.tokenService.sign({
        clinicId: savedClinic.id,
        username: savedClinic.username,
      });

      return { clinic: savedClinic, token };
    } catch (error) {
      translateError(error, 'signup');
    }
  }

  public async login(command: LoginCommand): Promise<AuthResult> {
    try {
      const clinic = await this.clinicRepository.findByUsername(
        command.username,
      );
      if (!clinic) throw new ClinicInvalidCredentialsError();

      await clinic.verifyPassword(
        command.password,
        this.encryptionService.verify.bind(this.encryptionService),
      );

      const token = this.tokenService.sign({
        clinicId: clinic.id,
        username: clinic.username,
      });

      return { clinic, token };
    } catch (error) {
      translateError(error, 'login');
    }
  }

  public async getClinic(clinicId: string): Promise<Clinic> {
    try {
      const clinic = await this.clinicRepository.findById(clinicId);
      if (!clinic) {
        throw new ClinicNotFoundError(clinicId);
      }
      return clinic;
    } catch (error) {
      translateError(error, 'getClinic');
    }
  }

  // ── Extraction Schemas ───────────────────────────────────────────

  public async createExtractionSchema(
    command: CreateExtractionSchemaCommand,
  ): Promise<ExtractionSchema> {
    try {
      // 1. Find the version this schema supersedes (0 when the clinic has none).
      const latestVersion = await this.clinicRepository.findLatestSchemaVersion(
        command.clinicId,
      );

      // 2. Build the aggregate — it validates every field (parameter name +
      //    mandatory description) and derives the next version itself.
      const schemaAggregate = new ExtractionSchema({
        clinicId: command.clinicId,
        title: command.title,
        schemaDefinition: command.fields,
        ...(latestVersion > 0 ? { oldVersion: latestVersion } : { version: 1 }),
      });

      // 3. Persist domain aggregate via ClinicRepositoryPort
      const savedSchema =
        await this.clinicRepository.saveExtractionSchema(schemaAggregate);
      // 4. Best-effort: refresh the clinic's cache entry so its relations (and
      //    this new version) are warm for the next schema-resolution lookup.
      void this.refreshClinicCache(command.clinicId);
      return savedSchema;
    } catch (error) {
      translateError(error, 'createExtractionSchema');
    }
  }

  public async listExtractionSchemas(
    clinicId: string,
  ): Promise<ExtractionSchema[]> {
    try {
      return await this.clinicRepository.listExtractionSchemasByClinic(
        clinicId,
      );
    } catch (error) {
      translateError(error, 'listExtractionSchemas');
    }
  }

  // ── Referrals ────────────────────────────────────────────────────

  cachingNewReferralsData = async ({
    clinicId,
    referrals,
    extractionSchema,
  }: CachingNewReferralsDataCommand) => {
    await Promise.all([
      this.cachingService.setCachedReferrals(
        referrals.map((referral): CachedReferral =>
          this.toCachedReferralFromAggregate(referral, extractionSchema),
        ),
      ),
      this.addToClinicIndexTolerantly(
        clinicId,
        referrals.map((referral) => referral.id),
      ),
    ]);
  };

  /**
   * Compensating event: deletes rows that were persisted but whose cache
   * write failed, restoring the pre-request state. Best-effort — a failed
   * rollback is logged, never allowed to mask the original error.
   */
  private async rollbackPersistedReferrals(
    referrals: Referral[],
  ): Promise<void> {
    try {
      await this.referralRepository.deleteReferralsByIds(
        referrals.map((referral) => referral.id),
      );
    } catch (error) {
      this.logger.error(
        `[Compensation] Failed to roll back ${referrals.length} persisted referral(s): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Compensating event: removes cache entries that landed while persistence
   * failed. Idempotent — DEL/SREM of keys that may or may not exist covers
   * partial pipeline writes too. Best-effort, logged on failure.
   */
  private async rollbackReferralCacheWrites(
    clinicId: string,
    referrals: Referral[],
  ): Promise<void> {
    try {
      await this.cachingService.deleteReferralsToCache(
        clinicId,
        referrals.map((referral) => referral.id),
      );
    } catch (error) {
      this.logger.error(
        `[Compensation] Failed to roll back referral cache writes: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  public async createNewReferralsWithAttachedPresignedUrls(
    command: CreateNewReferralsWithAttachedPresignedUrlsCommand,
  ): Promise<ReferralWithPresignedUpload[]> {
    try {
      if (command.files.length === 0) {
        // Reuses the existing ReferralValidationError — defense-in-depth behind
        // the DTO's @ArrayNotEmpty, no new error class.
        throw new ReferralValidationError(
          'At least one referral file is required',
        );
      }

      // 1. Resolve the FULL schema aggregate ONCE — clinic-scoped, not
      //    file-scoped. Returning the aggregate (rather than just its id)
      //    is what lets the Redis cache-aside write below carry the actual
      //    field definitions, not just a pointer
      const extractionSchema = await this.getExtractionSchema(
        command.clinicId,
        command.extractionSchemaId,
      );
      const extractionSchemaId = extractionSchema ? extractionSchema.id : null;

      // 2. Construct ALL aggregates up front — one bad fileName fails the
      //    whole batch before anything is persisted or presigned (fail-fast).
      const referrals = command.files.map(
        (file) =>
          new Referral({
            clinicId: command.clinicId,
            fileName: file.fileName,
            patientName: file.patientName ?? null,
            extractionSchemaId,
          }),
      );

      // 3. Presign all uploads. getSignedUrl is a local SigV4 signing
      //    operation (no AWS network round-trip), so doing this before the DB
      //    write is cheap and means a presigning failure leaves zero rows
      //    committed.
      const uploads = await Promise.all(
        referrals.map((referral) =>
          this.storageService.presignReferralUpload(
            command.clinicId,
            referral.id,
          ),
        ),
      );

      // 4+5. Persist all rows atomically AND write the combined cache entry —
      //      concurrently. Postgres and Redis have no shared transaction, so
      //      all-or-nothing is enforced with a compensating rollback: whichever
      //      side committed while the other failed is undone below.
      const [persistResult, cacheResult] = await Promise.allSettled([
        this.referralRepository.saveReferrals(referrals),
        this.cachingNewReferralsData({
          clinicId: command.clinicId,
          referrals,
          extractionSchema,
        }),
      ]);

      if (
        persistResult.status === 'fulfilled' &&
        cacheResult.status === 'fulfilled'
      ) {
        // 6. Zip by index — referrals/uploads/persisted are the same length
        //    and order as `command.files`.
        const savedReferrals = persistResult.value;
        return savedReferrals.map((referral, index) => ({
          referral,
          upload: uploads[index],
        }));
      }

      // ── Compensating rollback (simple two-step saga) ─────────────────────
      // Restore the pre-request state so the failure is all-or-nothing. The
      // cache deletes are idempotent, so running them unconditionally also
      // cleans up partial pipeline writes; the persisted rows are only deleted
      // when the DB side actually committed.
      await this.rollbackReferralCacheWrites(command.clinicId, referrals);
      if (persistResult.status === 'fulfilled') {
        await this.rollbackPersistedReferrals(persistResult.value);
      }

      if (persistResult.status === 'rejected') {
        throw persistResult.reason;
      }
      // Persistence committed, so the failure must be on the cache side.
      if (cacheResult.status === 'rejected') {
        throw cacheResult.reason;
      }
      throw new Error('Unreachable: allSettled has no third status');
    } catch (error) {
      translateError(error, 'createNewReferralsWithAttachedPresignedUrls');
    }
  }

  /**
   * Resolves the extraction schema that applies to a clinic, cache-aside:
   *
   *   1. `getExtractionSchemaFromClinicCache` → `getFullClinicFromCache` →
   *      rehydrate a `Clinic` instance → `clinic.findExtractionSchema(...)`
   *      returns the full schema straight from the cached clinic — **zero DB
   *      reads on a hit**.
   *   2. On a miss, hydrate the clinic (with its schemas) from Postgres; a
   *      missing clinic throws `ClinicNotFoundError`, and an explicitly
   *      requested schema id that still resolves to nothing throws
   *      `ExtractionSchemaNotFoundError` (a foreign id must not resolve to
   *      another clinic's schema).
   *   3. On a DB hit, `updateClinicInCache` re-syncs the cached clinic (with
   *      its full schemas) as a side effect, so the next lookup is a hit.
   */
  private async getExtractionSchema(
    clinicId: string,
    requestedExtractionSchemaId?: string | null,
  ): Promise<ExtractionSchema | null> {
    try {
      const schemaFromCache = await this.getExtractionSchemaFromClinicCache(
        clinicId,
        requestedExtractionSchemaId,
      );
      if (schemaFromCache) {
        return schemaFromCache;
      }

      const clinic = await this.clinicRepository.findById(clinicId);
      if (!clinic) {
        throw new ClinicNotFoundError(clinicId);
      }

      const schemas =
        await this.clinicRepository.listExtractionSchemasByClinic(clinicId);
      clinic.updateRelationSchemas(schemas);

      const schema = clinic.findExtractionSchema(requestedExtractionSchemaId);
      if (!schema && requestedExtractionSchemaId) {
        throw new ExtractionSchemaNotFoundError(requestedExtractionSchemaId);
      }

      // Best-effort side effect, non-blocking: the cached clinic is a
      // self-healing projection (a miss re-syncs it), and updateClinicInCache
      // swallows failures — so this must not add Redis latency to the request.
      void this.updateClinicInCache(clinic);
      return schema;
    } catch (error) {
      translateError(error, 'getExtractionSchema');
    }
  }

  private async getExtractionSchemaFromClinicCache(
    clinicId: string,
    requestedExtractionSchemaId?: string | null,
  ): Promise<ExtractionSchema | null> {
    const cachedClinic = await this.getFullClinicFromCache(clinicId);
    if (!cachedClinic) {
      return null;
    }
    const clinic = this.toClinicAggregateFromCache(cachedClinic);
    return clinic.findExtractionSchema(requestedExtractionSchemaId);
  }

  private async getFullClinicFromCache(
    clinicId: string,
  ): Promise<CachedClinic | null> {
    try {
      return await this.cachingService.getFullClinic(clinicId);
    } catch (error) {
      this.logCacheDegradation('read clinic', error);
      return null;
    }
  }

  /** Best-effort cache write — Postgres remains the system of record. */
  private async updateClinicInCache(clinic: Clinic): Promise<void> {
    try {
      await this.cachingService.setFullClinic(this.toCachedClinic(clinic));
    } catch (error) {
      this.logCacheDegradation('write clinic', error);
    }
  }

  /** Re-reads a clinic and its schemas, then refreshes its cache entry. */
  private async refreshClinicCache(clinicId: string): Promise<void> {
    try {
      const clinic = await this.clinicRepository.findById(clinicId);
      if (!clinic) {
        return;
      }
      const schemas =
        await this.clinicRepository.listExtractionSchemasByClinic(clinicId);
      clinic.updateRelationSchemas(schemas);
      await this.updateClinicInCache(clinic);
    } catch (error) {
      this.logger.warn(
        `Failed to refresh clinic cache for ${clinicId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private toCachedClinic(clinic: Clinic): CachedClinic {
    return {
      id: clinic.id,
      clinicName: clinic.clinicName,
      username: clinic.username,
      passwordHash: clinic.passwordHash.value,
      defaultExtractionSchemaId: clinic.defaultExtractionSchemaId,
      extractionSchemas: clinic.extractionSchemas.map((schema) => ({
        id: schema.id,
        clinicId: clinic.id,
        version: schema.version,
        title: schema.title,
        schemaDefinition: schema.schemaDefinition.map((field) => ({
          key: field.key,
          label: field.label,
          description: field.description,
        })),
      })),
      createdAt: clinic.createdAt.toISOString(),
      updatedAt: clinic.updatedAt.toISOString(),
    };
  }

  private toClinicAggregateFromCache(cached: CachedClinic): Clinic {
    return new Clinic({
      id: cached.id,
      clinicName: cached.clinicName,
      username: cached.username,
      passwordHash: cached.passwordHash,
      defaultExtractionSchemaId: cached.defaultExtractionSchemaId,
      extractionSchemas: cached.extractionSchemas.map(
        (schema) =>
          new ExtractionSchema({
            id: schema.id,
            clinicId: cached.id,
            version: schema.version,
            title: schema.title,
            schemaDefinition: schema.schemaDefinition,
          }),
      ),
      createdAt: new Date(cached.createdAt),
      updatedAt: new Date(cached.updatedAt),
    });
  }

  /**
   * Rehydrates the `Referral` aggregate from its persisted read-model
   * projection — construction re-validates identity, status, and every value
   * object, so a row can never be mutated through a malformed shell.
   */
  private toReferralAggregateFromData(data: ReferralData): Referral {
    return new Referral({
      id: data.id,
      clinicId: data.clinicId,
      fileName: data.fileName,
      patientName: data.patientName,
      extractionSchemaId: data.extractionSchemaId,
      status: ReferralStatus.from(data.status),
      extractedPayload: data.extractedPayload.map((field) =>
        this.toExtractedField(field),
      ),
      errorMessage: data.errorMessage,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    });
  }

  private toExtractedField(view: ExtractedFieldView): ExtractedField {
    return new ExtractedField(
      view.key,
      view.label,
      view.value,
      view.pageNumber,
      view.boundingBox
        ? new BoundingBox(
            view.boundingBox.xmin,
            view.boundingBox.ymin,
            view.boundingBox.xmax,
            view.boundingBox.ymax,
          )
        : null,
    );
  }

  /**
   * Design-doc step 10. Cache-aside over the per-clinic secondary index:
   *
   *   1. `SMEMBERS clinic:{id}:referrals` for the id set.
   *   2. Pipelined `HGET` of each referral's cached view.
   *   3. Any miss — a missing index key, or ids whose view is gone — falls back
   *      to Postgres and backfills Redis.
   *
   * Redis is never the system of record: every path can be served entirely
   * from Postgres, so a cold or evicted cache degrades latency, not
   * correctness.
   */
  public async listClinicReferrals(
    clinicId: string,
  ): Promise<ReferralListItem[]> {
    try {
      const cachedReferralIds = await this.readClinicIndexTolerantly(clinicId);

      // No index key at all — the clinic has never been cached (cold start,
      // eviction, flushed Redis). Rebuild the whole thing from Postgres.
      if (cachedReferralIds === null) {
        return this.attachDocumentUrls(
          await this.rebuildClinicCacheFromDatabase(clinicId),
        );
      }

      if (cachedReferralIds.length === 0) {
        return [];
      }

      const cachedViews =
        await this.readCachedReferralsTolerantly(cachedReferralIds);

      const viewsById = new Map<string, CachedReferral>();
      const missingReferralIds: string[] = [];
      cachedReferralIds.forEach((referralId, index) => {
        const view = cachedViews[index];
        if (view) {
          viewsById.set(referralId, view);
          return;
        }
        missingReferralIds.push(referralId);
      });

      // Partial miss: the index knows about referrals whose view has expired
      // or was never written. Fetch just those and backfill.
      if (missingReferralIds.length > 0) {
        const backfilled =
          await this.referralRepository.findManyReferralsByIds(
            missingReferralIds,
          );
        for (const view of backfilled) {
          viewsById.set(view.id, view);
        }
        await this.writeCachedReferralsTolerantly(backfilled);
      }

      return this.attachDocumentUrls(
        this.sortNewestFirst([...viewsById.values()]),
      );
    } catch (error) {
      translateError(error, 'listClinicReferrals');
    }
  }

  /**
   * Cache-aside for a single referral (design-doc step 10, single-id form):
   * try the referral's own Redis hash first, fall back to Postgres on a
   * miss and backfill Redis either way — the same contract
   * `listClinicReferrals` applies across the whole list, applied here
   * to one id. Powers `GET /referrals/:id`, which — per the "no new
   * fetching" constraint on the review screen — is now the single place
   * that reads referral detail, rather than the client filtering the full
   * list for one id.
   *
   * A cache hit for a referral owned by a DIFFERENT clinic is treated as an
   * absolute miss: the Redis key (`referral:{referralId}`) carries no
   * clinic scoping, unlike the per-clinic SET the list path reads ids from,
   * so this is the only place tenant isolation has to be enforced for a
   * direct single-id lookup.
   */
  public async getClinicReferral(
    clinicId: string,
    referralId: string,
  ): Promise<ReferralListItem> {
    try {
      const cached = await this.readCachedReferralTolerantly(referralId);
      if (cached && cached.clinicId === clinicId) {
        const [served] = await this.attachDocumentUrls([cached]);
        return served;
      }

      const view = await this.referralRepository.findReferralById(referralId);
      if (!view || view.clinicId !== clinicId) {
        throw new ReferralNotFoundError(referralId);
      }

      await this.writeCachedReferralsTolerantly([view]);
      const [served] = await this.attachDocumentUrls([view]);
      return served;
    } catch (error) {
      translateError(error, 'getClinicReferral');
    }
  }

  /**
   * Applies a worker result event (design: the worker publishes results to
   * the status-update queue and never writes Postgres). Strict DDD
   * 4-step lifecycle:
   *
   *   1. Fetch the aggregate root via the read-model query.
   *   2. Rehydrate the `Referral` aggregate from its projection (value objects
   *      re-validated in construction).
   *   3. Mutate exclusively through domain methods — `assertBelongsToClinic`
   *      enforces tenant isolation, `isInTerminalState` makes a redelivered
   *      event an idempotent no-op, and `updateStatus` owns the transition +
   *      payload/error semantics.
   *   4. Persist the mutated aggregate via `saveReferral`.
   *
   * The Postgres trigger fires LISTEN/NOTIFY on the change, driving the SSE
   * push, so this write is the notification source. The transport that
   * delivered the event is irrelevant here; the queue adapter calls this use
   * case.
   */

  /**
   * Reads a referral's read-model projection cache-first (Redis), falling back
   * to Postgres on a miss or cache degradation. Returns `null` only when the
   * referral does not exist anywhere.
   */
  private async readDataFromCacheWithFallback(
    referralId: string,
  ): Promise<ReferralData | null> {
    const referralFromCache =
      await this.readCachedReferralTolerantly(referralId);
    const referralData =
      referralFromCache ??
      (await this.referralRepository.findReferralById(referralId));
    return referralData;
  }

  public async applyReferralStatusUpdate(
    event: ReferralStatusUpdateEvent,
  ): Promise<void> {
    try {
      const referralData = await this.readDataFromCacheWithFallback(
        event.referralId,
      );
      if (!referralData) {
        // Deliberately NOT acked: the referral may not be visible yet (eventual
        // consistency), so throw and let SQS redeliver after the visibility
        // timeout instead of losing the result permanently.
        throw new ReferralNotFoundError(event.referralId);
      }

      const referral = this.toReferralAggregateFromData(referralData);

      // 3. Mutate via domain methods.
      referral.assertBelongsToClinic(event.clinicId);
      const targetStatus = ReferralStatusValue[event.status];
      if (
        referral.isInTerminalState ||
        referral.status.value === targetStatus
      ) {
        // Redelivered event — already applied, ack as a no-op rather than
        // redelivering forever.
        return;
      }
      if (event.status === 'PROCESSING') {
        referral.startProcessing();
      } else {
        referral.updateStatus(
          targetStatus,
          event.extractedPayload.map((field) => this.toExtractedField(field)),
          event.patientName,
          event.errorMessage,
        );
      }

      // 4. Persist the mutated aggregate.
      await this.referralRepository.saveReferral(referral);

      // 5. Refresh the cached read-model projection (view + clinic index) so a
      //    cold LISTEN or an immediate client read sees the terminal state
      //    even if the NOTIFY handler lags (the merge preserves the schema).
      await this.refreshReferralCache(event.referralId);
    } catch (error) {
      translateError(error, 'applyReferralStatusUpdate');
    }
  }

  /**
   * Design-doc step 9's serving half: a per-clinic stream of full,
   * cache-refreshed referrals, built on top of the raw NOTIFY feed.
   *
   * Owns both rules that used to live in the controller — tenant isolation
   * (NOTIFY is database-wide; every connected clinic sees every ping and
   * must filter to its own BEFORE the fetch, not after) and the
   * notify-then-refresh workflow — so they're covered by the same tests as
   * every other read path and can't drift from `listClinicReferrals`'s
   * cache-aside contract.
   */
  public observeClinicReferralChanges(
    clinicId: string,
  ): Observable<ReferralListItem> {
    return this.referralNotificationService.observeReferralChanges().pipe(
      filter((notification) => notification.clinicId === clinicId),
      // concatMap, not mergeMap: serialises the per-notification refreshes
      // so a burst of pings can't fan out into unbounded concurrent
      // Postgres reads.
      concatMap((notification) =>
        this.refreshReferralCache(notification.referralId),
      ),
      filter((referral): referral is ReferralListItem => referral !== null),
    );
  }

  private async refreshReferralCache(
    referralId: string,
  ): Promise<ReferralListItem | null> {
    const referralData =
      await this.referralRepository.findReferralById(referralId);
    if (!referralData) {
      return null;
    }
    await this.writeCachedReferralsTolerantly([referralData]);
    await this.addToClinicIndexTolerantly(referralData.clinicId, [
      referralData.id,
    ]);
    const [servedView] = await this.attachDocumentUrls([referralData]);
    return servedView ?? null;
  }

  public async warmAllReferralCaches(): Promise<number> {
    const referrals_data = await this.referralRepository.findAllReferrals();
    if (referrals_data.length === 0) {
      return 0;
    }

    await this.writeCachedReferralsTolerantly(referrals_data);

    const referralIdsByClinicId = new Map<string, string[]>();
    for (const referral of referrals_data) {
      const existing = referralIdsByClinicId.get(referral.clinicId) ?? [];
      existing.push(referral.id);
      referralIdsByClinicId.set(referral.clinicId, existing);
    }
    for (const [clinicId, referralIds] of referralIdsByClinicId) {
      await this.addToClinicIndexTolerantly(clinicId, referralIds);
    }

    return referrals_data.length;
  }

  private async rebuildClinicCacheFromDatabase(
    clinicId: string,
  ): Promise<CachedReferral[]> {
    const views =
      await this.referralRepository.findReferralsByClinicId(clinicId);

    await this.writeCachedReferralsTolerantly(views);
    await this.addToClinicIndexTolerantly(
      clinicId,
      views.map((view) => view.id),
    );

    return views;
  }

  private sortNewestFirst(views: CachedReferral[]): CachedReferral[] {
    // The index is an unordered SET, so ordering is re-derived here rather
    // than inherited from Redis. (A ZSET scored by createdAt would push this
    // into Redis and enable real pagination — see the "future improvements"
    // note in docs/product_solution_design.md.)
    return [...views].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  }

  // ── Cache access, tolerant by design ─────────────────────────────────
  // Reads and writes on the *serving* path never fail the request: Postgres
  // is the system of record and can answer every one of these queries on its
  // own. This is deliberately the opposite of the fail-closed policy on
  // referral *creation*, where a lost cache write would strand a referral the
  // worker could never resolve a schema for.

  private async readClinicIndexTolerantly(
    clinicId: string,
  ): Promise<string[] | null> {
    try {
      return await this.cachingService.getClinicReferralIds(clinicId);
    } catch (error) {
      this.logCacheDegradation('read clinic index', error);
      return null;
    }
  }

  private async readCachedReferralsTolerantly(
    referralIds: string[],
  ): Promise<(CachedReferral | null)[]> {
    try {
      return await this.cachingService.getManyCachedReferrals(referralIds);
    } catch (error) {
      this.logCacheDegradation('read cached referrals', error);
      return referralIds.map(() => null);
    }
  }

  private async readCachedReferralTolerantly(
    referralId: string,
  ): Promise<CachedReferral | null> {
    try {
      return await this.cachingService.getCachedReferral(referralId);
    } catch (error) {
      this.logCacheDegradation('read cached referral', error);
      return null;
    }
  }

  private async writeCachedReferralsTolerantly(
    views: CachedReferral[],
  ): Promise<void> {
    try {
      await this.cachingService.setCachedReferrals(views);
    } catch (error) {
      this.logCacheDegradation('write cached referrals', error);
    }
  }

  private async addToClinicIndexTolerantly(
    clinicId: string,
    referralIds: string[],
  ): Promise<void> {
    try {
      await this.cachingService.addReferralIdsToClinicIndex(
        clinicId,
        referralIds,
      );
    } catch (error) {
      this.logCacheDegradation('write clinic index', error);
    }
  }

  /**
   * Projects a freshly-created aggregate into the cached read model without a
   * second database read — everything the dashboard needs is already in hand
   * at creation time, including the schema title and version resolved in step 1.
   */
  private toCachedReferralFromAggregate(
    referral: Referral,
    extractionSchema: ExtractionSchema | null,
  ): CachedReferral {
    return {
      id: referral.id,
      clinicId: referral.clinicId,
      fileName: referral.fileName,
      patientName: referral.patientName,
      status: referral.status.value,
      extractionSchemaId: referral.extractionSchemaId,
      extractionSchemaVersion: extractionSchema?.version ?? null,
      extractionSchemaTitle: extractionSchema?.title ?? null,
      errorMessage: referral.errorMessage,
      // Fresh aggregates are always `AWAITING_UPLOAD` with an empty payload —
      // mirror `ReferralMapper.toPersistence` so the cached shape can never
      // drift from what a Postgres read of the same row would produce.
      extractedPayload: referral.extractedPayload.map((field) => ({
        key: field.key,
        label: field.label,
        value: field.value,
        pageNumber: field.pageNumber,
        boundingBox: field.boundingBox
          ? {
              xmin: field.boundingBox.xmin,
              ymin: field.boundingBox.ymin,
              xmax: field.boundingBox.xmax,
              ymax: field.boundingBox.ymax,
            }
          : null,
      })),
      createdAt: referral.createdAt.toISOString(),
      updatedAt: referral.updatedAt.toISOString(),
      extractionSchema,
    };
  }

  /**
   * Attaches a fresh presigned GET URL to each view right before it is served.
   * Presigning is a local SigV4 signing operation (no AWS network round-trip),
   * and it MUST happen here rather than being embedded in the cached view: a
   * presigned URL expires (~15 min) while the Redis view cache has no TTL, so
   * a cached URL would go stale silently.
   */
  private async attachDocumentUrls(
    views: CachedReferral[],
  ): Promise<ReferralListItem[]> {
    return Promise.all(
      views.map(async (view): Promise<ReferralListItem> => {
        const { url } = await this.storageService.presignGet({
          bucket: this.storageService.getConfiguredBucketName(),
          key: this.storageService.buildReferralPdfKey(view.clinicId, view.id),
        });
        return { ...view, documentUrl: url };
      }),
    );
  }

  private logCacheDegradation(operation: string, error: unknown): void {
    this.logger.warn(
      `Cache degraded (${operation}); serving from Postgres: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}
