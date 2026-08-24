import { REFERRAL_STATUSES, type ReferralStatus } from "@/types/referrals/referral";

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  [REFERRAL_STATUSES.COMPLETED]: "Completed",
  [REFERRAL_STATUSES.PROCESSING]: "Processing",
  [REFERRAL_STATUSES.PENDING]: "Pending",
  [REFERRAL_STATUSES.FAILED]: "Failed",
};

export const REFERRAL_FILTERS = {
  ALL: "all",
  PROCESSING: "processing",
  FAILED: "failed",
} as const;

export type ReferralFilter =
  (typeof REFERRAL_FILTERS)[keyof typeof REFERRAL_FILTERS];

export const REFERRAL_FILTER_LABELS: Record<ReferralFilter, string> = {
  [REFERRAL_FILTERS.ALL]: "All referrals",
  [REFERRAL_FILTERS.PROCESSING]: "Processing",
  [REFERRAL_FILTERS.FAILED]: "Failed",
};

/** Order the filters appear in the table's tab strip. */
export const REFERRAL_FILTER_ORDER: readonly ReferralFilter[] = [
  REFERRAL_FILTERS.ALL,
  REFERRAL_FILTERS.PROCESSING,
  REFERRAL_FILTERS.FAILED,
];

/**
 * Which statuses each tab admits. `ALL` has no entry — it filters nothing,
 * which keeps the "show everything" case out of the status matching logic.
 */
export const REFERRAL_FILTER_STATUSES: Partial<
  Record<ReferralFilter, readonly ReferralStatus[]>
> = {
  [REFERRAL_FILTERS.PROCESSING]: [
    REFERRAL_STATUSES.PROCESSING,
    REFERRAL_STATUSES.PENDING,
  ],
  [REFERRAL_FILTERS.FAILED]: [REFERRAL_STATUSES.FAILED],
};

/** Accepted upload types — the extractor only reads PDFs. */
export const REFERRAL_ACCEPTED_MIME_TYPE = "application/pdf";
export const REFERRAL_ACCEPTED_EXTENSION = ".pdf";

/** Per-file ceiling, mirrored by the API's presigned-URL policy. */
export const REFERRAL_MAX_FILE_BYTES = 20 * 1024 * 1024;
