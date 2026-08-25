"use client";

import * as React from "react";

import { REFERRAL_STATUS_LABELS } from "@/constants/referrals";
import { cn } from "@/lib/utils";
import { ChevronRightIcon, DocumentIcon } from "@/shared/Icon";
import { StatusPill } from "@/shared/StatusPill";
import type { StatusPillTone } from "@/shared/StatusPill/StatusPill.styles";
import {
  REFERRAL_STATUSES,
  type ReferralRowView,
  type ReferralStatus,
} from "@/types/referrals/referral";

import {
  referralChevronVariants,
  referralGridVariants,
  referralMetaVariants,
  referralPatientVariants,
  referralRowVariants,
  referralSecondaryCellVariants,
  referralThumbVariants,
} from "./ReferralRow.styles";

const STATUS_TONES: Record<ReferralStatus, StatusPillTone> = {
  [REFERRAL_STATUSES.AWAITING_UPLOAD]: "neutral",
  [REFERRAL_STATUSES.COMPLETED]: "success",
  [REFERRAL_STATUSES.PROCESSING]: "brand",
  [REFERRAL_STATUSES.PENDING]: "neutral",
  [REFERRAL_STATUSES.FAILED]: "danger",
};

export interface ReferralRowProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  referral: ReferralRowView;
  onOpen?: (id: string) => void;
}

/** One referral in the list — the whole row is the affordance into review. */
const ReferralRow = React.forwardRef<HTMLButtonElement, ReferralRowProps>(
  ({ className, onOpen, referral, ...props }, ref) => {
    const isFailed = referral.status === REFERRAL_STATUSES.FAILED;

    return (
      <button
        ref={ref}
        type="button"
        data-component="ReferralRow"
        data-status={referral.status}
        onClick={() => onOpen?.(referral.id)}
        {...props}
        className={cn(
          referralRowVariants({ failed: isFailed }),
          referralGridVariants(),
          className,
        )}
      >
        <span aria-hidden className={cn(referralThumbVariants())}>
          <DocumentIcon size="md" />
        </span>

        <span className={cn(referralPatientVariants())}>
          {referral.patientName ?? "—"}
        </span>

        <span className={cn(referralSecondaryCellVariants(), referralMetaVariants())}>
          {referral.fileName}
        </span>

        <span className={cn(referralSecondaryCellVariants(), referralMetaVariants())}>
          {referral.schemaLabel}
        </span>

        <StatusPill tone={STATUS_TONES[referral.status]}>
          {REFERRAL_STATUS_LABELS[referral.status]}
        </StatusPill>

        <span className={cn(referralSecondaryCellVariants(), referralMetaVariants())}>
          {referral.submittedLabel}
        </span>

        <ChevronRightIcon size="md" className={cn(referralChevronVariants())} />
      </button>
    );
  },
);
ReferralRow.displayName = "ReferralRow";

export { ReferralRow };
