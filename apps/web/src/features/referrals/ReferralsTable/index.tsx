"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  REFERRAL_FILTER_LABELS,
  REFERRAL_FILTER_ORDER,
  REFERRAL_FILTERS,
  type ReferralFilter,
} from "@/constants/referrals";
import { useReferralStatusStream } from "@/hooks/use-referral-status-stream";
import { cn } from "@/lib/utils";
import {
  countReferralsByFilter,
  filterReferrals,
} from "@/managers/referral-filter.manager";
import {
  mergeReferralRowView,
  mergeReferralRowViews,
  sortReferralRowsNewestFirst,
  toReferralRowDisplayViews,
  toReferralRowView,
} from "@/managers/referral-view.manager";
import { referralDetailRoute } from "@/routes";
import { Tabs } from "@/shared/Tabs";
import { useUploadingReferralIds } from "@/stores/referral-upload.store";
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

export interface ReferralsTableProps extends React.HTMLAttributes<HTMLElement> {
  referrals: readonly ReferralRowView[];
}

/** Tabbed list of every referral the clinic has submitted. */
const ReferralsTable = React.forwardRef<HTMLElement, ReferralsTableProps>(
  ({ className, referrals, ...props }, ref) => {
    const router = useRouter();
    const [filter, setFilter] = React.useState<ReferralFilter>(
      REFERRAL_FILTERS.ALL,
    );

    // Seeded from the server-rendered list, then kept live by SSE. A later
    // server-rendered `referrals` prop (e.g. after `router.refresh()` from
    // an unrelated schema action) is MERGED in, not swapped in wholesale —
    // that snapshot can be older than what SSE has already delivered (it was
    // read from Postgres at some earlier instant), and `mergeReferralRowView`
    // drops anything that would regress a row's `updatedAt` backward.
    const [liveReferrals, setLiveReferrals] =
      React.useState<readonly ReferralRowView[]>(referrals);

    React.useEffect(() => {
      setLiveReferrals((current) => mergeReferralRowViews(current, referrals));
    }, [referrals]);

    useReferralStatusStream(
      React.useCallback((changedReferral) => {
        setLiveReferrals((current) =>
          mergeReferralRowView(current, toReferralRowView(changedReferral)),
        );
      }, []),
    );

    // Referral ids this tab is still PUTting to S3. They are folded into the
    // rows below so the Uploading tab, counts, and pills all treat the
    // client-only `UPLOADING` status like any other (see
    // `toReferralRowDisplayViews`).
    const uploadingReferralIds = useUploadingReferralIds();

    // Pure server rows (as SSE delivers them) resolved to their presentation
    // status: rows being uploaded show `UPLOADING`, everything else keeps its
    // server status. Everything downstream — filters, counts, pills — reads
    // from this projection.
    const displayReferrals = React.useMemo(
      () => toReferralRowDisplayViews(liveReferrals, uploadingReferralIds),
      [liveReferrals, uploadingReferralIds],
    );

    const counts = React.useMemo(
      () => countReferralsByFilter(displayReferrals),
      [displayReferrals],
    );

    const visible = React.useMemo(
      () =>
        filterReferrals(
          sortReferralRowsNewestFirst(displayReferrals),
          filter,
        ),
      [filter, displayReferrals],
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
                {filter === REFERRAL_FILTERS.UPLOADING
                  ? "Uploads you start will appear here until their PDFs finish uploading."
                  : `Referrals matching “${REFERRAL_FILTER_LABELS[filter]}” will appear as soon as extraction reports back.`}
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
                <span className={cn(referralsTableHeadCellVariants())}>
                  Patient
                </span>
                <span className={cn(referralsTableSecondaryHeadCellVariants())}>
                  File
                </span>
                <span className={cn(referralsTableSecondaryHeadCellVariants())}>
                  Schema
                </span>
                <span className={cn(referralsTableHeadCellVariants())}>
                  Status
                </span>
                <span className={cn(referralsTableSecondaryHeadCellVariants())}>
                  Submitted
                </span>
                <span className={cn(referralsTableSecondaryHeadCellVariants())}>
                  # extractions
                </span>
                <span />
              </div>

              <div className={cn(referralsTableBodyVariants())}>
                {visible.map((referral) => (
                  <ReferralRow
                    key={referral.id}
                    referral={referral}
                    onOpen={(id) => router.push(referralDetailRoute(id))}
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
