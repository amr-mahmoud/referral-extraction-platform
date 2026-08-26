import { REFERRAL_STATUSES, type ReferralStatus } from "@/types/referrals/referral";
import type { StatusPillTone } from "@/shared/StatusPill/StatusPill.styles";

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  [REFERRAL_STATUSES.AWAITING_UPLOAD]: "Awaiting upload",
  [REFERRAL_STATUSES.COMPLETED]: "Completed",
  [REFERRAL_STATUSES.PROCESSING]: "Processing",
  [REFERRAL_STATUSES.PENDING]: "Pending",
  [REFERRAL_STATUSES.FAILED]: "Failed",
  [REFERRAL_STATUSES.REJECTED]: "Rejected",
};

/** Status pill tone per referral state — shared by the table row and the review header. */
export const REFERRAL_STATUS_TONES: Record<ReferralStatus, StatusPillTone> = {
  [REFERRAL_STATUSES.AWAITING_UPLOAD]: "neutral",
  [REFERRAL_STATUSES.COMPLETED]: "success",
  [REFERRAL_STATUSES.PROCESSING]: "brand",
  [REFERRAL_STATUSES.PENDING]: "neutral",
  [REFERRAL_STATUSES.FAILED]: "danger",
  [REFERRAL_STATUSES.REJECTED]: "danger",
};

/**
 * Statuses whose row opens the review screen: the source document (or a
 * terminal error) is there to inspect. In-progress rows are deliberately
 * excluded — there's nothing to review until the worker reports back.
 */
export const REFERRAL_OPENABLE_STATUSES: readonly ReferralStatus[] = [
  REFERRAL_STATUSES.COMPLETED,
  REFERRAL_STATUSES.FAILED,
  REFERRAL_STATUSES.REJECTED,
];

/** Statuses showing the "extraction in progress" spinner on the row. */
export const REFERRAL_IN_PROGRESS_STATUSES: readonly ReferralStatus[] = [
  REFERRAL_STATUSES.PENDING,
  REFERRAL_STATUSES.PROCESSING,
];

export const REFERRAL_FILTERS = {
  ALL: "all",
  PROCESSING: "processing",
  PENDING: "pending",
  COMPLETED: "completed",
  AWAITING_UPLOAD: "awaiting_upload",
  FAILED: "failed",
  REJECTED: "rejected",
} as const;

export type ReferralFilter =
  (typeof REFERRAL_FILTERS)[keyof typeof REFERRAL_FILTERS];

export const REFERRAL_FILTER_LABELS: Record<ReferralFilter, string> = {
  [REFERRAL_FILTERS.ALL]: "All referrals",
  [REFERRAL_FILTERS.PROCESSING]: "Processing",
  [REFERRAL_FILTERS.PENDING]: "Pending",
  [REFERRAL_FILTERS.COMPLETED]: "Completed",
  [REFERRAL_FILTERS.AWAITING_UPLOAD]: "Awaiting upload",
  [REFERRAL_FILTERS.FAILED]: "Failed",
  [REFERRAL_FILTERS.REJECTED]: "Rejected",
};

/** Order the filters appear in the table's tab strip. */
export const REFERRAL_FILTER_ORDER: readonly ReferralFilter[] = [
  REFERRAL_FILTERS.ALL,
  REFERRAL_FILTERS.AWAITING_UPLOAD,
  REFERRAL_FILTERS.PENDING,
  REFERRAL_FILTERS.PROCESSING,
  REFERRAL_FILTERS.COMPLETED,
  REFERRAL_FILTERS.FAILED,
  REFERRAL_FILTERS.REJECTED,
];

/**
 * Which statuses each tab admits. `ALL` has no entry — it filters nothing,
 * which keeps the "show everything" case out of the status matching logic.
 * Every other tab maps one-to-one to a single referral status so the tab list
 * mirrors the statuses the worker can actually produce.
 */
export const REFERRAL_FILTER_STATUSES: Partial<
  Record<ReferralFilter, readonly ReferralStatus[]>
> = {
  [REFERRAL_FILTERS.AWAITING_UPLOAD]: [REFERRAL_STATUSES.AWAITING_UPLOAD],
  [REFERRAL_FILTERS.PENDING]: [REFERRAL_STATUSES.PENDING],
  [REFERRAL_FILTERS.PROCESSING]: [REFERRAL_STATUSES.PROCESSING],
  [REFERRAL_FILTERS.COMPLETED]: [REFERRAL_STATUSES.COMPLETED],
  [REFERRAL_FILTERS.FAILED]: [REFERRAL_STATUSES.FAILED],
  // REJECTED (content-level: not a valid referral) is a distinct status from
  // FAILED (system-level error) and gets its own tab.
  [REFERRAL_FILTERS.REJECTED]: [REFERRAL_STATUSES.REJECTED],
};

/** Accepted upload types — the extractor only reads PDFs. */
export const REFERRAL_ACCEPTED_MIME_TYPE = "application/pdf";
export const REFERRAL_ACCEPTED_EXTENSION = ".pdf";

/** Per-file ceiling, mirrored by the API's presigned-URL policy. */
export const REFERRAL_MAX_FILE_BYTES = 20 * 1024 * 1024;
