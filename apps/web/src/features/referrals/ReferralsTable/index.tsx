"use client";

import * as React from "react";

import {
  REFERRAL_FILTER_LABELS,
  REFERRAL_FILTER_ORDER,
  REFERRAL_FILTERS,
  type ReferralFilter,
} from "@/constants/referrals";
import { cn } from "@/lib/utils";
import {
  countReferralsByFilter,
  filterReferrals,
} from "@/managers/referral-filter.manager";
import { Tabs } from "@/shared/Tabs";
import type { ReferralRowView } from "@/types/referrals/referral";

import { ReferralRow } from "../ReferralRow";
import { referralGridVariants } from "../ReferralRow/ReferralRow.styles";
import {
  referralsTableBodyVariants,
  referralsTableEmptyHintVariants,
  referralsTableEmptyTitleVariants,
  referralsTableEmptyVariants,
  referralsTableHeadCellVariants,
  referralsTableHeadVariants,
  referralsTableSecondaryHeadCellVariants,
  referralsTableVariants,
} from "./ReferralsTable.styles";

const PANEL_ID = "referrals-panel";

export interface ReferralsTableProps
  extends React.HTMLAttributes<HTMLElement> {
  referrals: readonly ReferralRowView[];
  onOpenReferral?: (id: string) => void;
}

/** Tabbed list of every referral the clinic has submitted. */
const ReferralsTable = React.forwardRef<HTMLElement, ReferralsTableProps>(
  ({ className, onOpenReferral, referrals, ...props }, ref) => {
    const [filter, setFilter] = React.useState<ReferralFilter>(
      REFERRAL_FILTERS.ALL,
    );

    const counts = React.useMemo(
      () => countReferralsByFilter(referrals),
      [referrals],
    );

    const visible = React.useMemo(
      () => filterReferrals(referrals, filter),
      [filter, referrals],
    );

    const items = React.useMemo(
      () =>
        REFERRAL_FILTER_ORDER.map((value) => ({
          value,
          label: REFERRAL_FILTER_LABELS[value],
          count: value === REFERRAL_FILTERS.ALL ? undefined : counts[value],
          controls: PANEL_ID,
        })),
      [counts],
    );

    return (
      <section
        ref={ref}
        aria-label="Referrals"
        data-component="ReferralsTable"
        data-state={filter}
        {...props}
        className={cn(referralsTableVariants({ className }))}
      >
        <Tabs
          items={items}
          value={filter}
          onChange={setFilter}
          label="Filter referrals by status"
        />

        <div id={PANEL_ID} role="tabpanel" aria-labelledby={`${filter}-tab`}>
          {visible.length === 0 ? (
            <div className={cn(referralsTableEmptyVariants())}>
              <p className={cn(referralsTableEmptyTitleVariants())}>
                Nothing here yet
              </p>
              <p className={cn(referralsTableEmptyHintVariants())}>
                Referrals matching “{REFERRAL_FILTER_LABELS[filter]}” will appear
                as soon as extraction reports back.
              </p>
            </div>
          ) : (
            <>
              <div
                aria-hidden
                className={cn(
                  referralGridVariants(),
                  referralsTableHeadVariants(),
                  "pb-2",
                )}
              >
                <span />
                <span className={cn(referralsTableHeadCellVariants())}>Patient</span>
                <span className={cn(referralsTableSecondaryHeadCellVariants())}>
                  File
                </span>
                <span className={cn(referralsTableSecondaryHeadCellVariants())}>
                  Schema
                </span>
                <span className={cn(referralsTableHeadCellVariants())}>Status</span>
                <span className={cn(referralsTableSecondaryHeadCellVariants())}>
                  Submitted
                </span>
                <span />
              </div>

              <div className={cn(referralsTableBodyVariants())}>
                {visible.map((referral) => (
                  <ReferralRow
                    key={referral.id}
                    referral={referral}
                    onOpen={onOpenReferral}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    );
  },
);
ReferralsTable.displayName = "ReferralsTable";

export { ReferralsTable };
