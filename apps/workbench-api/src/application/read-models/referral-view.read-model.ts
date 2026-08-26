/**
 * The dashboard-facing projection of a referral.
 *
 * A read model rather than the `Referral` aggregate: the list needs the
 * extraction schema's *version* (to render "Custom schema v3"), which lives on
 * a different table and is not part of the referral's consistency boundary.
 * Loading the aggregate would not give it, and widening the aggregate to carry
 * it would put a foreign entity's field inside it purely for display.
 *
 * Every field is a primitive so this round-trips through `JSON.stringify` into
 * Redis and back without a mapper — dates are ISO-8601 strings, not `Date`.
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

export interface ReferralView {
  id: string;
  clinicId: string;
  fileName: string;
  patientName: string | null;
  status: string;
  extractionSchemaId: string | null;
  /** `null` means the default LLM schema (no custom schema was resolved). */
  extractionSchemaVersion: number | null;
  errorMessage: string | null;
  /** Static once written, so it is safe inside the no-expiry Redis view cache. */
  extractedPayload: ExtractedFieldView[];
  createdAt: string;
  updatedAt: string;
}

/**
 * What the read endpoints actually serve. A presigned GET URL expires (15 min
 * default) while the Redis view cache has no TTL, so `documentUrl` is computed
 * fresh on every serve and deliberately never persisted — it is not part of
 * `ReferralView` precisely so it cannot be cached stale.
 */
export interface ReferralListItemView extends ReferralView {
  documentUrl: string;
}
