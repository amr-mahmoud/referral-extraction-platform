import type { ReferralView } from '../read-models/referral-view.read-model';

export const CACHING_SERVICE_PORT = 'CACHING_SERVICE_PORT';

/**
 * The schema shape the worker rehydrates from Redis — mirrors
 * `ExtractionSchemaMapper.toPersistence`'s field shape so the same
 * `{key, label, description}` structure can be re-validated into a
 * `FieldDefinitionInput[]` on the other side without translation.
 */
export interface CachedExtractionSchema {
  id: string;
  version: number;
  /** Version name — not consumed by the worker, but carried for completeness. */
  title: string;
  schemaDefinition: { key: string; label: string; description: string }[];
}

export interface ReferralCacheEntry {
  referralId: string;
  fileName: string;
  /** `null` when the clinic has no default schema — worker falls back to the default LLM schema. */
  extractionSchema: CachedExtractionSchema | null;
}

/**
 * Cached under the same `referral:{referral_id}` hash (field `referral`) that
 * already carries the worker's `fileName`/`extractionSchema` — one key per
 * referral rather than a second parallel namespace, so a referral is
 * invalidated in exactly one place.
 */
export type CachedReferralView = ReferralView;

/**
 * Design-doc steps 3 and 10.
 *
 * Step 3 — a Redis cache-aside hash per referral (`referral:{referral_id}`),
 * written at referral-creation time so the worker can recover the original
 * file name and the resolved schema in one O(1) lookup; neither survives into
 * the S3 object key (`referrals/{clinicId}/{referralId}.pdf`) or the SQS
 * message built from it.
 *
 * Step 10 — a per-clinic secondary index (`clinic:{clinic_id}:referrals`, a
 * Redis SET) mapping one clinic to many referral ids, so the dashboard reads
 * its list without a Postgres table scan. Every read is cache-aside: a miss
 * falls back to Postgres and backfills, so Redis is never the system of record.
 */
export interface CachingServicePort {
  /** Writes every referral hash in one pipelined round-trip. */
  setManyReferralCaches(entries: ReferralCacheEntry[]): Promise<void>;
  getReferralCache(referralId: string): Promise<ReferralCacheEntry | null>;

  /** Upserts the dashboard-facing projection onto the referral's existing hash. */
  setReferralView(view: CachedReferralView): Promise<void>;
  setManyReferralViews(views: CachedReferralView[]): Promise<void>;
  getReferralView(referralId: string): Promise<CachedReferralView | null>;
  getManyReferralViews(
    referralIds: string[],
  ): Promise<(CachedReferralView | null)[]>;

  /** Secondary index: adds referral ids to `clinic:{clinicId}:referrals`. */
  addReferralIdsToClinicIndex(
    clinicId: string,
    referralIds: string[],
  ): Promise<void>;
  /**
   * Returns `null` (not `[]`) when the index key does not exist, so callers can
   * tell "this clinic genuinely has no referrals" apart from "nothing cached
   * yet, go read Postgres".
   */
  getClinicReferralIds(clinicId: string): Promise<string[] | null>;
}
