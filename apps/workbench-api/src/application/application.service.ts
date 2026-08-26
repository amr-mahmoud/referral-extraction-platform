import { Inject, Injectable, Logger } from '@nestjs/common';
import { Clinic } from '../domain/clinic/clinic.aggregate';
import {
  ClinicInvalidCredentialsError,
  ClinicNotFoundError,
  ClinicUsernameTakenError,
} from '../domain/clinic/clinic.errors';
import { ExtractionSchemaNotFoundError } from '../domain/extraction-schema/extraction-schema.errors';
import { ExtractionSchema } from '../domain/extraction-schema/extraction-schema.aggregate';
import { Referral } from '../domain/referral/referral.aggregate';
import {
  ReferralNotFoundError,
  ReferralValidationError,
} from '../domain/referral/referral.errors';
import { NotImplementedError } from './errors/not-implemented.error';
import { translateError } from './errors/application.exception';
import {
  CACHING_SERVICE_PORT,
  type CachedClinic,
  type CachingServicePort,
  type ReferralCacheEntry,
} from './ports/caching.port';
import type {
  ReferralListItemView,
  ReferralView,
} from './read-models/referral-view.read-model';
import {
  CLINIC_REPOSITORY_PORT,
  type ClinicRepositoryPort,
} from './ports/clinic-repository.port';
import { ENCRYPTION_PORT, type EncryptionPort } from './ports/encryption.port';
import {
  REFERRAL_REPOSITORY_PORT,
  type ReferralRepositoryPort,
} from './ports/referral-repository.port';
import { STORAGE_PORT, type StoragePort } from './ports/storage.port';
import { TOKEN_PORT, type TokenPort } from './ports/token.port';

// ── Command & result types — see ./types.ts ──────────────────────────

import type {
  AuthResult,
  CorrectReferralCommand,
  CreateExtractionSchemaCommand,
  CreateNewReferralsWithAttachedPresignedUrlsCommand,
  LoginCommand,
  ReferralWithPresignedUpload,
  SignupCommand,
} from './types';

export type {
  AuthResult,
  CorrectReferralCommand,
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
  }: {
    clinicId: string;
    referrals: Referral[];
    extractionSchema: ExtractionSchema | null;
  }) => {
    await Promise.all([
      this.cachingService.setManyReferralsToCache(
        referrals.map((referral): ReferralCacheEntry => ({
          referralId: referral.id,
          fileName: referral.fileName,
          extractionSchema,
          referralView: this.toReferralViewFromAggregate(
            referral,
            extractionSchema,
          ),
        })),
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
      //    field definitions, not just a pointer the worker would have to
      //    re-fetch from Postgres.
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
   *      resolves the schema **id** from the cached clinic's id collections,
   *      then the full schema payload is fetched from Postgres.
   *   2. On a miss, hydrate the clinic (with its schema ids) from Postgres; a
   *      missing clinic throws `ClinicNotFoundError`, and an explicitly
   *      requested schema id that still resolves to nothing throws
   *      `ExtractionSchemaNotFoundError` (a foreign id must not resolve to
   *      another clinic's schema).
   *   3. On a DB hit, `updateRelationSchemas` + `updateClinicInCache` refresh
   *      the cached clinic's id collections as a side effect, so the next
   *      lookup skips the clinic+schema-list reads.
   */
  private async getExtractionSchema(
    clinicId: string,
    requestedExtractionSchemaId?: string | null,
  ): Promise<ExtractionSchema | null> {
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

    const schemaId = clinic.findExtractionSchema(requestedExtractionSchemaId);
    if (!schemaId && requestedExtractionSchemaId) {
      throw new ExtractionSchemaNotFoundError(requestedExtractionSchemaId);
    }
    const schema =
      schemas.find((candidate) => candidate.id === schemaId) ?? null;

    //TODO isn't this supposed to be asyncrounous
    await this.updateClinicInCache(clinic);
    return schema;
  }

  private async getExtractionSchemaFromClinicCache(
    clinicId: string,
    requestedExtractionSchemaId?: string | null,
  ): Promise<ExtractionSchema | null> {
    const cachedClinic = await this.getFullClinicFromCache(clinicId);
    if (!cachedClinic) {
      return null;
    }
    const clinic = new Clinic({
      id: cachedClinic.id,
      clinicName: cachedClinic.clinicName,
      username: cachedClinic.username,
      passwordHash: cachedClinic.passwordHash,
      defaultExtractionSchemaId: cachedClinic.defaultExtractionSchemaId,
      createdAt: new Date(cachedClinic.createdAt),
      updatedAt: new Date(cachedClinic.updatedAt),
      referralIds: cachedClinic.referralIds,
      extractionSchemaIds: cachedClinic.extractionSchemaIds,
    });
    const schemaId = clinic.findExtractionSchema(requestedExtractionSchemaId);
    if (!schemaId) {
      return null;
    }
    // The cache holds ids only — fetch the full schema payload by the resolved id.
    return this.clinicRepository.findExtractionSchemaById(schemaId);
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
      // The clinic's referral ids already live in the per-clinic index
      // (`clinic:{id}:referrals`) — carry them into the cached clinic so the
      // aggregate rehydrates with its full id collections.
      const referralIds =
        (await this.readClinicIndexTolerantly(clinic.id)) ?? [];
      await this.cachingService.setFullClinic(
        this.toCachedClinic(clinic, referralIds),
      );
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

  private toCachedClinic(
    clinic: Clinic,
    referralIds: string[] = clinic.referralIds,
  ): CachedClinic {
    return {
      id: clinic.id,
      clinicName: clinic.clinicName,
      username: clinic.username,
      passwordHash: clinic.passwordHash.value,
      defaultExtractionSchemaId: clinic.defaultExtractionSchemaId,
      referralIds,
      extractionSchemaIds: clinic.extractionSchemaIds,
      createdAt: clinic.createdAt.toISOString(),
      updatedAt: clinic.updatedAt.toISOString(),
    };
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
  public async listReferralViewsByClinic(
    clinicId: string,
  ): Promise<ReferralListItemView[]> {
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
        await this.readReferralViewsTolerantly(cachedReferralIds);

      const viewsById = new Map<string, ReferralView>();
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
          await this.referralRepository.findReferralViewsByIds(
            missingReferralIds,
          );
        for (const view of backfilled) {
          viewsById.set(view.id, view);
        }
        await this.writeReferralViewsTolerantly(backfilled);
      }

      return this.attachDocumentUrls(
        this.sortNewestFirst([...viewsById.values()]),
      );
    } catch (error) {
      translateError(error, 'listReferralViewsByClinic');
    }
  }

  /**
   * Cache-aside for a single referral (design-doc step 10, single-id form):
   * try the referral's own Redis hash first, fall back to Postgres on a
   * miss and backfill Redis either way — the same contract
   * `listReferralViewsByClinic` applies across the whole list, applied here
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
  public async getReferralViewByClinic(
    clinicId: string,
    referralId: string,
  ): Promise<ReferralListItemView> {
    try {
      const cached = await this.readReferralViewTolerantly(referralId);
      if (cached && cached.clinicId === clinicId) {
        const [served] = await this.attachDocumentUrls([cached]);
        return served;
      }

      const [view] = await this.referralRepository.findReferralViewsByIds([
        referralId,
      ]);
      if (!view || view.clinicId !== clinicId) {
        throw new ReferralNotFoundError(referralId);
      }

      await this.writeReferralViewsTolerantly([view]);
      const [served] = await this.attachDocumentUrls([view]);
      return served;
    } catch (error) {
      translateError(error, 'getReferralViewByClinic');
    }
  }

  /** Re-reads one referral from Postgres and refreshes its cache entry. */
  public async refreshReferralViewCache(
    referralId: string,
  ): Promise<ReferralListItemView | null> {
    const [view] = await this.referralRepository.findReferralViewsByIds([
      referralId,
    ]);
    if (!view) {
      return null;
    }
    await this.writeReferralViewsTolerantly([view]);
    await this.addToClinicIndexTolerantly(view.clinicId, [view.id]);
    const [servedView] = await this.attachDocumentUrls([view]);
    return servedView ?? null;
  }

  /** Dev-only warm-up: loads every referral into Redis so the cache starts hot. */
  public async warmAllReferralCaches(): Promise<number> {
    const views = await this.referralRepository.findAllReferralViews();
    if (views.length === 0) {
      return 0;
    }

    await this.writeReferralViewsTolerantly(views);

    const referralIdsByClinicId = new Map<string, string[]>();
    for (const view of views) {
      const existing = referralIdsByClinicId.get(view.clinicId) ?? [];
      existing.push(view.id);
      referralIdsByClinicId.set(view.clinicId, existing);
    }
    for (const [clinicId, referralIds] of referralIdsByClinicId) {
      await this.addToClinicIndexTolerantly(clinicId, referralIds);
    }

    return views.length;
  }

  private async rebuildClinicCacheFromDatabase(
    clinicId: string,
  ): Promise<ReferralView[]> {
    const views =
      await this.referralRepository.findReferralViewsByClinicId(clinicId);

    await this.writeReferralViewsTolerantly(views);
    await this.addToClinicIndexTolerantly(
      clinicId,
      views.map((view) => view.id),
    );

    return views;
  }

  private sortNewestFirst(views: ReferralView[]): ReferralView[] {
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

  private async readReferralViewsTolerantly(
    referralIds: string[],
  ): Promise<(ReferralView | null)[]> {
    try {
      return await this.cachingService.getManyReferralViews(referralIds);
    } catch (error) {
      this.logCacheDegradation('read referral views', error);
      return referralIds.map(() => null);
    }
  }

  private async readReferralViewTolerantly(
    referralId: string,
  ): Promise<ReferralView | null> {
    try {
      return await this.cachingService.getReferralView(referralId);
    } catch (error) {
      this.logCacheDegradation('read referral view', error);
      return null;
    }
  }

  private async writeReferralViewsTolerantly(
    views: ReferralView[],
  ): Promise<void> {
    try {
      await this.cachingService.setManyReferralViews(views);
    } catch (error) {
      this.logCacheDegradation('write referral views', error);
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
  private toReferralViewFromAggregate(
    referral: Referral,
    extractionSchema: ExtractionSchema | null,
  ): ReferralView {
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
    views: ReferralView[],
  ): Promise<ReferralListItemView[]> {
    return Promise.all(
      views.map(async (view): Promise<ReferralListItemView> => {
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

  /**
   * Single error boundary for every public use case. Anything already typed as
   * an `HttpException` (domain, repository, `NotImplementedError`, Nest
   * built-ins) passes straight through to the global filter; anything else is
   * wrapped in an `ApplicationException` so no untyped exception can escape
   * this layer.
   */

  public getReferralByClinic(
    clinicId: string,
    referralId: string,
  ): Promise<Referral> {
    void clinicId;
    void referralId;
    throw new NotImplementedError('ApplicationService.getReferralByClinic');
  }

  public correctReferral(command: CorrectReferralCommand): Promise<Referral> {
    void command;
    throw new NotImplementedError('ApplicationService.correctReferral');
  }
}
