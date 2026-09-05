"use client";

import * as React from "react";

import {
  REFERRAL_IN_PROGRESS_STATUSES,
  REFERRAL_OPENABLE_STATUSES,
  REFERRAL_STATUS_LABELS,
  REFERRAL_STATUS_TONES,
} from "@/constants/referrals";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "@/shared/Icon";
import { StatusPill } from "@/shared/StatusPill";
import {
  REFERRAL_STATUSES,
  type ReferralDisplayRowView,
} from "@/types/referrals/referral";

import {
  referralChevronVariants,
  referralExtractionCountNaVariants,
  referralExtractionCountValueVariants,
  referralExtractionCountVariants,
  referralGridVariants,
  referralMetaVariants,
  referralPatientVariants,
  referralRowVariants,
  referralSecondaryCellVariants,
} from "./ReferralRow.styles";

export interface ReferralRowProps extends Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> {
  /**
   * A row already resolved to its presentation status (see
   * `toReferralRowDisplayViews`) — its `status` may be the client-only
   * `UPLOADING` while this tab is still PUTting the PDF to S3.
   */
  referral: ReferralDisplayRowView;
  onOpen?: (id: string) => void;
}

/** One referral in the list. Completed/failed rows open the review screen. */
const ReferralRow = React.forwardRef<HTMLButtonElement, ReferralRowProps>(
  ({ className, onOpen, referral, ...props }, ref) => {
    const isFailed =
      referral.status === REFERRAL_STATUSES.FAILED ||
      referral.status === REFERRAL_STATUSES.REJECTED;

    const isClickable = REFERRAL_OPENABLE_STATUSES.includes(referral.status);
    const isExtractionInProgress = REFERRAL_IN_PROGRESS_STATUSES.includes(
      referral.status,
    );

    return (
      <button
        ref={ref}
        type="button"
        data-component="ReferralRow"
        data-status={referral.status}
        data-interactive={isClickable}
        onClick={isClickable ? () => onOpen?.(referral.id) : undefined}
        tabIndex={isClickable ? 0 : -1}
        aria-disabled={!isClickable}
        {...props}
        className={cn(
          referralRowVariants({ failed: isFailed, interactive: isClickable }),
          referralGridVariants(),
          className,
        )}
      >
        <span className={cn(referralPatientVariants())}>
          {referral.patientName ?? "—"}
        </span>

        <span
          className={cn(
            referralSecondaryCellVariants(),
            referralMetaVariants(),
          )}
        >
          {referral.fileName}
        </span>

        <span
          className={cn(
            referralSecondaryCellVariants(),
            referralMetaVariants(),
          )}
        >
          {referral.schemaLabel}
        </span>

        <StatusPill
          tone={REFERRAL_STATUS_TONES[referral.status]}
          loading={isExtractionInProgress}
        >
          {REFERRAL_STATUS_LABELS[referral.status]}
        </StatusPill>

        <span
          className={cn(
            referralSecondaryCellVariants(),
            referralMetaVariants(),
          )}
        >
          {referral.submittedLabel}
        </span>

        <span
          className={cn(
            referralExtractionCountVariants(),
            referral.extractionCount === null
              ? referralExtractionCountNaVariants()
              : referralExtractionCountValueVariants(),
          )}
        >
          {referral.extractionCount === null ? "N/A" : referral.extractionCount}
        </span>

        <ChevronRightIcon size="md" className={cn(referralChevronVariants())} />
      </button>
    );
  },
);
ReferralRow.displayName = "ReferralRow";

export { ReferralRow };
