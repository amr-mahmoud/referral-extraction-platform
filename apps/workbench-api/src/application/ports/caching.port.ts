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
  schemaDefinition: { key: string; label: string; description: string }[];
}

export interface ReferralCacheEntry {
  referralId: string;
  fileName: string;
  /** `null` when the clinic has no default schema — worker falls back to the default LLM schema. */
  extractionSchema: CachedExtractionSchema | null;
}

/**
 * Design-doc step 3: a Redis cache-aside hash per referral
 * (`referral:{referral_id}` → `{ fileName, extractionSchema }`), written at
 * referral-creation time so the worker can recover both the original file
 * name and the resolved schema in one O(1) lookup — neither survives into
 * the S3 object key (`referrals/{clinicId}/{referralId}.pdf`) or the SQS
 * message built from it.
 */
export interface CachingServicePort {
  /** Writes every referral hash in one pipelined round-trip. */
  setManyReferralCaches(entries: ReferralCacheEntry[]): Promise<void>;
  getReferralCache(referralId: string): Promise<ReferralCacheEntry | null>;
}
