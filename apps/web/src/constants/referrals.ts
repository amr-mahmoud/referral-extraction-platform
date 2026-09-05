import {
  CLIENT_REFERRAL_STATUSES,
  REFERRAL_STATUSES,
  type ReferralDisplayStatus,
} from "@/types/referrals/referral";
import type { StatusPillTone } from "@/shared/StatusPill/StatusPill.styles";

export const REFERRAL_STATUS_LABELS: Record<ReferralDisplayStatus, string> = {
  [CLIENT_REFERRAL_STATUSES.UPLOADING]: "Uploading",
  [REFERRAL_STATUSES.COMPLETED]: "Completed",
  [REFERRAL_STATUSES.PROCESSING]: "Processing",
  [REFERRAL_STATUSES.PENDING]: "Pending",
  [REFERRAL_STATUSES.FAILED]: "Failed",
  [REFERRAL_STATUSES.REJECTED]: "Rejected",
};

/**
 * Status pill tone per referral state — shared by the table row and the review
 * header. Every status has its OWN color so no two pills read the same.
 */
export const REFERRAL_STATUS_TONES: Record<ReferralDisplayStatus, StatusPillTone> = {
  [CLIENT_REFERRAL_STATUSES.UPLOADING]: "info",
  [REFERRAL_STATUSES.COMPLETED]: "success",
  [REFERRAL_STATUSES.PROCESSING]: "brand",
  [REFERRAL_STATUSES.PENDING]: "neutral",
  [REFERRAL_STATUSES.FAILED]: "danger",
  [REFERRAL_STATUSES.REJECTED]: "warning",
};

/**
 * Statuses whose row opens the review screen: the source document (or a
 * terminal error) is there to inspect. In-progress rows are deliberately
 * excluded — there's nothing to review until the worker reports back.
 * Typed over the display union so `includes` accepts client-only statuses
 * (which are simply never listed here).
 */
export const REFERRAL_OPENABLE_STATUSES: readonly ReferralDisplayStatus[] = [
  REFERRAL_STATUSES.COMPLETED,
  REFERRAL_STATUSES.FAILED,
  REFERRAL_STATUSES.REJECTED,
];

/**
 * Statuses showing the "in progress" spinner on the row. `UPLOADING` is the
 * client-only analogue of `PENDING` while this tab is still pushing the PDF
 * bytes to S3.
 */
export const REFERRAL_IN_PROGRESS_STATUSES: readonly ReferralDisplayStatus[] = [
  CLIENT_REFERRAL_STATUSES.UPLOADING,
  REFERRAL_STATUSES.PENDING,
  REFERRAL_STATUSES.PROCESSING,
];

export const REFERRAL_FILTERS = {
  ALL: "all",
  UPLOADING: "uploading",
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  REJECTED: "rejected",
} as const;

export type ReferralFilter =
  (typeof REFERRAL_FILTERS)[keyof typeof REFERRAL_FILTERS];

export const REFERRAL_FILTER_LABELS: Record<ReferralFilter, string> = {
  [REFERRAL_FILTERS.ALL]: "All referrals",
  [REFERRAL_FILTERS.UPLOADING]: "Uploading",
  [REFERRAL_FILTERS.PENDING]: "Pending",
  [REFERRAL_FILTERS.PROCESSING]: "Processing",
  [REFERRAL_FILTERS.COMPLETED]: "Completed",
  [REFERRAL_FILTERS.FAILED]: "Failed",
  [REFERRAL_FILTERS.REJECTED]: "Rejected",
};

/** Order the filters appear in the table's tab strip. */
export const REFERRAL_FILTER_ORDER: readonly ReferralFilter[] = [
  REFERRAL_FILTERS.ALL,
  REFERRAL_FILTERS.UPLOADING,
  REFERRAL_FILTERS.PENDING,
  REFERRAL_FILTERS.PROCESSING,
  REFERRAL_FILTERS.COMPLETED,
  REFERRAL_FILTERS.FAILED,
  REFERRAL_FILTERS.REJECTED,
];

/**
 * Which statuses each tab admits. `ALL` has no entry — it filters nothing,
 * which keeps the "show everything" case out of the status matching logic.
 * Every other tab maps one-to-one to a single displayed status; the values
 * are `ReferralDisplayStatus` because the Uploading tab admits the client-only
 * status while the rest admit server statuses the worker actually produces.
 */
export const REFERRAL_FILTER_STATUSES: Partial<
  Record<ReferralFilter, readonly ReferralDisplayStatus[]>
> = {
  [REFERRAL_FILTERS.UPLOADING]: [CLIENT_REFERRAL_STATUSES.UPLOADING],
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
