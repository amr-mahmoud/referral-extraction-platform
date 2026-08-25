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
  createdAt: string;
  updatedAt: string;
}
