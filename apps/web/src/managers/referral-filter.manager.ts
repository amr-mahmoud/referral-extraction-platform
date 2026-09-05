import {
  REFERRAL_FILTER_STATUSES,
  REFERRAL_FILTER_ORDER,
  type ReferralFilter,
} from "@/constants/referrals";
import type { ReferralDisplayStatus } from "@/types/referrals/referral";

/**
 * Narrow a referral list to one tab. A filter with no status entry (the "all"
 * tab) admits everything, so adding a tab means adding a status list — not
 * another branch here.
 *
 * Rows are expected to already be display views (see
 * `toReferralRowDisplayViews`), so a client-only status such as `UPLOADING`
 * matches the tab that admits it like any server status would.
 */
export function filterReferrals<
  TReferral extends { status: ReferralDisplayStatus },
>(referrals: readonly TReferral[], filter: ReferralFilter): TReferral[] {
  const statuses = REFERRAL_FILTER_STATUSES[filter];
  if (!statuses) return [...referrals];

  return referrals.filter((referral) => statuses.includes(referral.status));
}

/** Per-tab row counts, used for the badge next to each tab label. */
export function countReferralsByFilter<
  TReferral extends { status: ReferralDisplayStatus },
>(referrals: readonly TReferral[]): Record<ReferralFilter, number> {
  return REFERRAL_FILTER_ORDER.reduce(
    (counts, filter) => {
      counts[filter] = filterReferrals(referrals, filter).length;
      return counts;
    },
    {} as Record<ReferralFilter, number>,
  );
}
