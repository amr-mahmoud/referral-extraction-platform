/**
 * Hand-written for now. Once the WorkBench API publishes its OpenAPI document
 * these become the generated `openapi-typescript` response models.
 */

export const REFERRAL_STATUSES = {
  AWAITING_UPLOAD: "AWAITING_UPLOAD",
  COMPLETED: "COMPLETED",
  PROCESSING: "PROCESSING",
  PENDING: "PENDING",
  FAILED: "FAILED",
  /** Content-level rejection (not a valid referral) — set by the worker, distinct from a system FAILED. */
  REJECTED: "REJECTED",
} as const;

export type ReferralStatus =
  (typeof REFERRAL_STATUSES)[keyof typeof REFERRAL_STATUSES];

export interface ReferralSummary {
  id: string;
  /** `null` until extraction resolves a patient — failed rows never get one. */
  patientName: string | null;
  fileName: string;
  schemaLabel: string;
  status: ReferralStatus;
  /** ISO-8601. Formatted for display at the server boundary, not in the table. */
  submittedAt: string;
}

/**
 * What the table actually renders. Relative timestamps are resolved once on the
 * server so the client never re-derives them and desynchronises during hydration.
 */
export interface ReferralRowView extends Omit<ReferralSummary, "submittedAt"> {
  submittedLabel: string;
}
