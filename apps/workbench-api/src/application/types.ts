import type { FieldDefinitionInput } from '../domain/domain-types/extraction-schema.input';
import type { Clinic } from '../domain/clinic/clinic.aggregate';
import type { ExtractionSchema } from '../domain/extraction-schema/extraction-schema.aggregate';
import type { Referral } from '../domain/referral/referral.aggregate';
import type { PresignedUrl } from './ports/storage.port';
import type { ClinicInputProps } from '../domain/clinic/types';

// ── Referral projection (the canonical cached/served shape) ─────────────

/** Every status a worker result can carry — PROCESSING first, then a terminal state. */
export const WORKER_REFERRAL_STATUSES = [
  'PROCESSING',
  'COMPLETED',
  'REJECTED',
  'FAILED',
] as const;

export type WorkerReferralStatus = (typeof WORKER_REFERRAL_STATUSES)[number];

/** The terminal states a worker result can apply. FAILED stays retryable (see repository port). */
export const TERMINAL_REFERRAL_STATUSES = [
  'COMPLETED',
  'REJECTED',
  'FAILED',
] as const;

export type ReferralTerminalStatus =
  (typeof TERMINAL_REFERRAL_STATUSES)[number];

/**
 * A worker result event, delivered via the status-update queue. The worker
 * publishes a `PROCESSING` event on claim and exactly one terminal event
 * after. The transport adapter parses the message into this shape; the
 * ApplicationService validates and applies it via the domain (startProcessing
 * for PROCESSING, updateStatus for the terminal states).
 */
export interface ReferralStatusUpdateEvent {
  referralId: string;
  clinicId: string;
  status: WorkerReferralStatus;
  extractedPayload: ExtractedFieldView[];
  patientName: string | null;
  extractionSchemaId: string | null;
  errorMessage: string | null;
  extractedAt: string;
}

/**
 * One extracted field as carried in a referral projection. Every field is a
 * primitive so the projection round-trips through `JSON.stringify` into Redis
 * and back without a mapper — dates are ISO-8601 strings, not `Date`.
 */
export interface ExtractedFieldView {
  key: string;
  label: string;
  value: string;
  pageNumber: number;
  boundingBox: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  } | null;
}

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
  clinicId: string;
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
  clinicId: string;
  files: CreateReferralItemCommand[];
  /** Shared across the whole batch. Falls back to the clinic's default, then `null`. */
  extractionSchemaId?: string | null;
}

export interface ReferralWithPresignedUpload {
  referral: Referral;
  upload: PresignedUrl;
}

export interface ListReferralsQuery {
  clinicId: string;
  page: number;
  limit: number;
}

// ── Referral Cache Side-Effects ───────────────────────────────────────

/** Input for the best-effort cache write that follows referral persistence. */
export interface CachingNewReferralsDataCommand {
  clinicId: string;
  referrals: Referral[];
  extractionSchema: ExtractionSchema | null;
}

/**
 * The schema shape the worker rehydrates from Redis — mirrors
 * `ExtractionSchemaMapper.toPersistence`'s field shape so the same
 * `{key, label, description}` structure can be re-validated into a
 * `FieldDefinitionInput[]` on the other side without translation.
 */
export interface CachedExtractionSchema {
  id: string;
  clinicId?: string;
  version: number;
  /** Version name — not consumed by the worker, but carried for completeness. */
  title: string;
  schemaDefinition: { key: string; label: string; description: string }[];
}

/**
 * The full cached payload for `referral:{referral_id}` — ONE flat object
 * carrying everything a referral's cache needs: the dashboard/review
 * projection plus the worker-only full schema payload.
 *
 * Written once at creation (`setCachedReferrals`); on every status
 * change the object is rewritten whole via `setCachedReferrals`
 * (read-modify-write), which carries the static `extractionSchema` forward.
 */
export interface CachedReferral {
  id: string;
  clinicId: string;
  fileName: string;
  patientName: string | null;
  status: string;
  extractionSchemaId: string | null;
  /** `null` means the default LLM schema (no custom schema was resolved). */
  extractionSchemaVersion: number | null;
  /** Version name; the dashboard prefers this over the bare version integer. */
  extractionSchemaTitle: string | null;
  errorMessage: string | null;
  /** Static once written, so it is safe inside the no-expiry Redis view cache. */
  extractedPayload: ExtractedFieldView[];
  createdAt: string;
  updatedAt: string;
  /** The full schema payload the worker needs — null when no custom schema applies. */
  extractionSchema: CachedExtractionSchema | null;
}

export type ReferralData = CachedReferral;
/**
 * What the read endpoints actually serve. A presigned GET URL expires (15 min
 * default) while the Redis cache has no TTL, so `documentUrl` is computed
 * fresh on every serve and deliberately never persisted.
 */
export interface ReferralListItem extends CachedReferral {
  documentUrl: string;
}

/**
 * The clinic aggregate as cached for the extraction-schema resolution path
 * (`clinic:{clinicId}`). Carries the password hash so the aggregate can be
 * fully rehydrated without a Postgres round-trip; the hash is one-way bcrypt,
 * not a plaintext credential. Relations carry the **full schema payloads**
 * (same `CachedExtractionSchema` shape the worker metadata uses) so a cache
 * hit resolves the schema with zero DB reads. Referral membership lives in
 * the `clinic:{clinicId}:referrals` index, not here.
 *
 * Derived from the domain's `ClinicInputProps` via `Omit`: the constructor-only
 * password inputs (`rawPassword`/`hashedPassword`) are dropped and the shared
 * fields (`clinicName`/`username`) stay single-sourced, while the cache-specific
 * fields are concretized (required ids, serialized dates, cached schema shape).
 */
export type CachedClinic = Omit<
  ClinicInputProps,
  | 'id'
  | 'passwordHash'
  | 'rawPassword'
  | 'hashedPassword'
  | 'defaultExtractionSchemaId'
  | 'extractionSchemas'
  | 'referralIds'
  | 'createdAt'
  | 'updatedAt'
> & {
  id: string;
  passwordHash: string;
  defaultExtractionSchemaId: string | null;
  extractionSchemas: CachedExtractionSchema[];
  createdAt: string;
  updatedAt: string;
};
