import { Inject, Injectable, Logger } from '@nestjs/common';
import { Clinic } from '../domain/clinic/clinic.aggregate';
import {
  ClinicInvalidCredentialsError,
  ClinicNotFoundError,
  ClinicUsernameTakenError,
} from '../domain/clinic/clinic.errors';
import type { FieldDefinitionInput } from '../domain/domain-types/extraction-schema.input';
import { ExtractionSchemaNotFoundError } from '../domain/extraction-schema/extraction-schema.errors';
import { ExtractionSchema } from '../domain/extraction-schema/extraction-schema.aggregate';
import { ExtractedField } from '../domain/referral/extracted-field.value-object';
import { Referral } from '../domain/referral/referral.aggregate';
import {
  ReferralNotFoundError,
  ReferralValidationError,
} from '../domain/referral/referral.errors';
import { ClinicId } from '../domain/shared/ids/clinic-id.value-object';
import { ExtractionSchemaId } from '../domain/shared/ids/extraction-schema-id.value-object';
import { ReferralId } from '../domain/shared/ids/referral-id.value-object';
import { DomainError } from '../domain/shared/domain.error';
import { NotImplementedError } from './errors/not-implemented.error';
import {
  CACHING_SERVICE_PORT,
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
import {
  PresignedUrl,
  STORAGE_PORT,
  type StoragePort,
} from './ports/storage.port';
import { TOKEN_PORT, type TokenPort } from './ports/token.port';

// ── Auth Commands & Results ──────────────────────────────────────────

export interface SignupCommand {
  clinicName: string;
  username: string;
  password: string;
}

export interface LoginCommand {
  username: string;
  password: string;
}

export interface AuthResult {
  clinic: Clinic;
  token: string;
}

// ── Extraction Schema Commands ───────────────────────────────────────

export interface CreateExtractionSchemaCommand {
  clinicId: ClinicId;
  /** Optional version name; the aggregate falls back to `Custom schema v{n}`. */
  title?: string;
  /** Already normalised by the interface layer; see `normalizeExtractionSchemaFields`. */
  fields: FieldDefinitionInput[];
}

// ── Referral Commands & Queries ──────────────────────────────────────

export interface CreateReferralItemCommand {
  fileName: string;
  patientName?: string | null;
}

export interface CreateNewReferralsWithAttachedPresignedUrlsCommand {
  clinicId: ClinicId;
  files: CreateReferralItemCommand[];
  /** Shared across the whole batch. Falls back to the clinic's default, then `null`. */
  extractionSchemaId?: ExtractionSchemaId | null;
}

export interface ReferralWithPresignedUpload {
  referral: Referral;
  upload: PresignedUrl;
}

export interface ListReferralsQuery {
  clinicId: ClinicId;
  page: number;
  limit: number;
}

export interface CorrectReferralCommand {
  clinicId: ClinicId;
  referralId: ReferralId;
  extractedPayload: ExtractedField[];
}

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
        clinicId: savedClinic.id.value,
        username: savedClinic.username,
      });

      return { clinic: savedClinic, token };
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new Error(
        `Failed to sign up clinic: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public async login(command: LoginCommand): Promise<AuthResult> {
    try {
      const clinic = await this.clinicRepository.findByUsername(
        command.username,
      );
      if (!clinic) {
        throw new ClinicInvalidCredentialsError();
      }

      await clinic.verifyPassword(
        command.password,
        this.encryptionService.verify.bind(this.encryptionService),
      );

      const token = this.tokenService.sign({
        clinicId: clinic.id.value,
        username: clinic.username,
      });

      return { clinic, token };
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new Error(
        `Failed to log in clinic: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public async getClinic(clinicId: ClinicId): Promise<Clinic> {
    try {
      const clinic = await this.clinicRepository.findById(clinicId);
      if (!clinic) {
        throw new ClinicNotFoundError(clinicId.value);
      }
      return clinic;
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new Error(
        `Failed to get clinic: ${error instanceof Error ? error.message : String(error)}`,
      );
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
      return await this.clinicRepository.saveExtractionSchema(schemaAggregate);
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new Error(
        `Failed to create extraction schema: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public async listExtractionSchemas(
    clinicId: ClinicId,
  ): Promise<ExtractionSchema[]> {
    try {
      return await this.clinicRepository.listExtractionSchemasByClinic(
        clinicId,
      );
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new Error(
        `Failed to list extraction schemas: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // ── Referrals ────────────────────────────────────────────────────

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
      const extractionSchema = await this.resolveExtractionSchema(
        command.clinicId,
        command.extractionSchemaId,
      );
      const extractionSchemaId = extractionSchema
        ? ExtractionSchemaId.from(extractionSchema.id)
        : null;

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

      // 4. Persist all rows atomically — all-or-nothing.
      const savedReferrals =
        await this.referralRepository.saveReferrals(referrals);

      // 5. Cache-aside write (design-doc step 3): one Redis hash per
      //    referral, `{ fileName, extractionSchema }`, so the worker can
      //    recover both in one O(1) lookup — neither survives into the S3
      //    key or the SQS message built from it. Fail-closed: a cache write
      //    failure fails the whole request (falls through to the catch
      //    below) rather than silently leaving referrals the worker can
      //    never resolve a schema for.
      await this.cachingService.setManyReferralCaches(
        savedReferrals.map((referral): ReferralCacheEntry => ({
          referralId: referral.id,
          fileName: referral.fileName,
          extractionSchema: extractionSchema
            ? {
                id: extractionSchema.id,
                version: extractionSchema.version,
                title: extractionSchema.title,
                schemaDefinition: extractionSchema.schemaDefinition.map(
                  (field) => ({
                    key: field.key,
                    label: field.label,
                    description: field.description,
                  }),
                ),
              }
            : null,
        })),
      );

      // 6. Warm the serving caches (design-doc step 10) so the new rows show
      //    up on the dashboard without a Postgres round-trip. Best-effort,
      //    unlike step 5 above: these only accelerate reads that Postgres can
      //    always answer, and the LISTEN/NOTIFY refresh repairs anything lost
      //    here when the INSERT trigger fires.
      await this.writeReferralViewsTolerantly(
        savedReferrals.map((referral) =>
          this.toReferralViewFromAggregate(referral, extractionSchema),
        ),
      );
      await this.addToClinicIndexTolerantly(
        command.clinicId.value,
        savedReferrals.map((referral) => referral.id),
      );

      // 7. Zip by index — referrals/uploads/savedReferrals are all the same
      //    length and order as `command.files`.
      return savedReferrals.map((referral, index) => ({
        referral,
        upload: uploads[index],
      }));
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new Error(
        `Failed to create referrals: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async resolveExtractionSchema(
    clinicId: ClinicId,
    requestedExtractionSchemaId: ExtractionSchemaId | null | undefined,
  ): Promise<ExtractionSchema | null> {
    if (requestedExtractionSchemaId) {
      const schema = await this.clinicRepository.findExtractionSchemaById(
        requestedExtractionSchemaId,
      );
      // Treat "belongs to another clinic" the same as "not found" — a valid
      // but foreign id must not leak whether it exists.
      if (!schema || !schema.clinicId.equals(clinicId)) {
        throw new ExtractionSchemaNotFoundError(
          requestedExtractionSchemaId.value,
        );
      }
      return schema;
    }

    const clinic = await this.clinicRepository.findById(clinicId);
    if (!clinic) {
      throw new ClinicNotFoundError(clinicId.value);
    }
    if (!clinic.defaultExtractionSchemaId) {
      return null;
    }
    return this.clinicRepository.findExtractionSchemaById(
      clinic.defaultExtractionSchemaId,
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
  public async listReferralViewsByClinic(
    clinicId: ClinicId,
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
      if (error instanceof DomainError) {
        throw error;
      }
      throw new Error(
        `Failed to list referrals: ${error instanceof Error ? error.message : String(error)}`,
      );
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
    clinicId: ClinicId,
    referralId: string,
  ): Promise<ReferralListItemView> {
    try {
      const cached = await this.readReferralViewTolerantly(referralId);
      if (cached && cached.clinicId === clinicId.value) {
        const [served] = await this.attachDocumentUrls([cached]);
        return served;
      }

      const [view] = await this.referralRepository.findReferralViewsByIds([
        referralId,
      ]);
      if (!view || view.clinicId !== clinicId.value) {
        throw new ReferralNotFoundError(referralId);
      }

      await this.writeReferralViewsTolerantly([view]);
      const [served] = await this.attachDocumentUrls([view]);
      return served;
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw new Error(
        `Failed to get referral: ${error instanceof Error ? error.message : String(error)}`,
      );
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
    clinicId: ClinicId,
  ): Promise<ReferralView[]> {
    const views =
      await this.referralRepository.findReferralViewsByClinicId(clinicId);

    await this.writeReferralViewsTolerantly(views);
    await this.addToClinicIndexTolerantly(
      clinicId.value,
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
    clinicId: ClinicId,
  ): Promise<string[] | null> {
    try {
      return await this.cachingService.getClinicReferralIds(clinicId.value);
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
      clinicId: referral.clinicId.value,
      fileName: referral.fileName,
      patientName: referral.patientName,
      status: referral.status.value,
      extractionSchemaId: referral.extractionSchemaId?.value ?? null,
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
          key: this.storageService.buildReferralPdfKey(
            ClinicId.from(view.clinicId),
            ReferralId.from(view.id),
          ),
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

  public async getReferralByClinic(
    clinicId: ClinicId,
    referralId: ReferralId,
  ): Promise<Referral> {
    try {
      void clinicId;
      void referralId;
      throw new NotImplementedError('ApplicationService.getReferralByClinic');
    } catch (error) {
      if (
        error instanceof DomainError ||
        error instanceof NotImplementedError
      ) {
        throw error;
      }
      throw new Error(
        `Failed to get referral: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public async correctReferral(
    command: CorrectReferralCommand,
  ): Promise<Referral> {
    try {
      void command;
      throw new NotImplementedError('ApplicationService.correctReferral');
    } catch (error) {
      if (
        error instanceof DomainError ||
        error instanceof NotImplementedError
      ) {
        throw error;
      }
      throw new Error(
        `Failed to correct referral: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
