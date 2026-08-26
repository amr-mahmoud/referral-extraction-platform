import * as React from "react";
import Link from "next/link";

import {
  REFERRAL_IN_PROGRESS_STATUSES,
  REFERRAL_STATUS_LABELS,
  REFERRAL_STATUS_TONES,
} from "@/constants/referrals";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/routes";
import { ChevronLeftIcon } from "@/shared/Icon";
import { StatusPill } from "@/shared/StatusPill";
import type { ReferralDetailView } from "@/types/referrals/referral";

import {
  referralDetailHeaderBackLinkVariants,
  referralDetailHeaderBreadcrumbVariants,
  referralDetailHeaderPillVariants,
  referralDetailHeaderSeparatorVariants,
  referralDetailHeaderTitleVariants,
  referralDetailHeaderVariants,
} from "./ReferralDetailHeader.styles";

export interface ReferralDetailHeaderProps
  extends React.HTMLAttributes<HTMLElement> {
  referral: ReferralDetailView;
}

/**
 * Slim breadcrumb bar (wireframe 1e): back to the dashboard, then
 * "{patientName} — {fileName}" and the referral's status pill.
 */
const ReferralDetailHeader = React.forwardRef<
  HTMLElement,
  ReferralDetailHeaderProps
>(({ className, referral, ...props }, ref) => {
  return (
    <header
      ref={ref}
      data-component="ReferralDetailHeader"
      data-status={referral.status}
      {...props}
      className={cn(referralDetailHeaderVariants({ className }))}
    >
      <div className={cn(referralDetailHeaderBreadcrumbVariants())}>
        <Link
          href={ROUTES.DASHBOARD}
          className={cn(referralDetailHeaderBackLinkVariants())}
        >
          <ChevronLeftIcon size="sm" />
          <span>Referrals</span>
        </Link>

        <span aria-hidden className={cn(referralDetailHeaderSeparatorVariants())}>
          /
        </span>

        <span className={cn(referralDetailHeaderTitleVariants())}>
          {referral.patientName ?? "—"} — {referral.fileName}
        </span>
      </div>

      <StatusPill
        tone={REFERRAL_STATUS_TONES[referral.status]}
        loading={REFERRAL_IN_PROGRESS_STATUSES.includes(referral.status)}
        className={cn(referralDetailHeaderPillVariants())}
      >
        {REFERRAL_STATUS_LABELS[referral.status]}
      </StatusPill>
    </header>
  );
});
ReferralDetailHeader.displayName = "ReferralDetailHeader";

export { ReferralDetailHeader };
