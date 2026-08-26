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
  /**
   * Number of extracted fields once extraction completed. `null` (rendered as
   * "N/A") until the worker reports back — there is no count to show while a
   * referral is awaiting upload, pending, or processing.
   */
  extractionCount: number | null;
  /** ISO-8601. Formatted for display at the server boundary, not in the table. */
  submittedAt: string;
}

/**
 * What the table actually renders. Relative timestamps are resolved once on the
 * server so the client never re-derives them and desynchronises during hydration.
 */
export interface ReferralRowView extends Omit<ReferralSummary, "submittedAt"> {
  /** Raw ISO-8601 creation timestamp — the canonical sort key for the table (newest first). */
  createdAt: string;
  /**
   * Raw ISO-8601 last-update timestamp — lets `mergeReferralRowView` refuse
   * to replace a row with an older snapshot of itself. Two independent
   * channels can deliver a row (the initial/refreshed server list, and the
   * SSE stream), and they don't arrive in a guaranteed order relative to
   * each other; this is what keeps a stale one from clobbering a fresher one.
   */
  updatedAt: string;
  submittedLabel: string;
}

/**
 * Normalized spatial source coordinates for one extracted field, on a 0–1000
 * grid in both axes, top-left origin — the coordinate space Gemini's grounded
 * bounding boxes are produced in. Scaled to rendered PDF pixels by
 * `bounding-box.manager.ts`.
 */
export interface BoundingBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

/** One extracted field as served by the API, ready for the review panel. */
export interface ExtractedFieldView {
  key: string;
  label: string;
  value: string;
  pageNumber: number;
  boundingBox: BoundingBox | null;
}

/**
 * Standalone read model for `/referrals/[id]`. Deliberately NOT derived from
 * `ReferralRowView` — the list row and the detail screen serve different
 * purposes, and deriving one from the other would couple the list shape to
 * detail-only fields like `documentUrl`/`extractedPayload`.
 */
export interface ReferralDetailView {
  id: string;
  patientName: string | null;
  fileName: string;
  schemaLabel: string;
  status: ReferralStatus;
  submittedLabel: string;
  errorMessage: string | null;
  /** Presigned S3 GET URL for the source PDF (re-signed by the API per serve). */
  documentUrl: string;
  extractedPayload: ExtractedFieldView[];
}
