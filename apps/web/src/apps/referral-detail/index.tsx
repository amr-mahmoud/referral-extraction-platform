"use client";

import * as React from "react";
import dynamic from "next/dynamic";

import { ExtractedFieldsPanel } from "@/features/review/ExtractedFieldsPanel";
import { ReferralDetailHeader } from "@/features/review/ReferralDetailHeader";
import { useReferralStatusStream } from "@/hooks/use-referral-status-stream";
import { ReferralDetailLayout } from "@/layouts/ReferralDetailLayout";
import { toReferralDetailView } from "@/managers/referral-view.manager";
import { cn } from "@/lib/utils";
import { LoaderIcon } from "@/shared/Icon";
import type {
  ExtractedFieldView,
  ReferralDetailView,
} from "@/types/referrals/referral";

// react-pdf's canvas work is browser-only and its worker must be referenced by
// a plain path string (Turbopack can't handle the `new URL(...)` entry), so the
// viewer module is skipped during SSR and fetched only on the client. The
// `loading` fallback keeps the left grid cell occupied while the chunk loads.
const PdfViewer = dynamic(
  () => import("@/features/review/PdfViewer").then((m) => m.PdfViewer),
  { ssr: false, loading: PdfViewerLoading },
);

function PdfViewerLoading() {
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2 bg-canvas p-5">
      <LoaderIcon size="xl" className="animate-spin text-brand-deep" />
      <p className="text-[12px] font-medium text-muted">Loading PDF…</p>
    </div>
  );
}

export interface ReferralDetailAppProps {
  referral: ReferralDetailView;
}

/**
 * Entry point for `/referrals/[id]` (wireframe 1e). Served entirely from the
 * same list/SSE payload as the dashboard — no per-id fetch — and kept live by
 * the shared referral-changes stream filtered to this one referral.
 *
 * Selection state is parent-owned local state: a two-child selection like this
 * doesn't warrant a store, and the architecture doc's own note says it "resets
 * on navigation," which local state gives for free.
 */
export function ReferralDetailApp({ referral }: ReferralDetailAppProps) {
  const [liveReferral, setLiveReferral] =
    React.useState<ReferralDetailView>(referral);
  // Selection is by POSITION in the extracted payload, not by field key: the
  // worker derives `key` from the LLM's `fieldName`, which is not guaranteed
  // unique (and can be undefined for rows predating the key/label enrichment),
  // so a key-based selection would always resolve to the first collision.
  const [selectedFieldIndex, setSelectedFieldIndex] = React.useState<
    number | null
  >(null);

  // React docs' "adjusting state when a prop changes" pattern: if the server
  // hands back a fresh referral (e.g. a new render of this RSC after
  // revalidation), re-seed local state during render rather than in an effect,
  // so the live copy can't be shadowed by a stale server snapshot.
  const [previousReferral, setPreviousReferral] = React.useState(referral);
  if (previousReferral !== referral) {
    setPreviousReferral(referral);
    setLiveReferral(referral);
  }

  useReferralStatusStream(
    React.useCallback(
      (changedReferral) => {
        if (changedReferral.id !== referral.id) return;
        setLiveReferral(toReferralDetailView(changedReferral));
      },
      [referral.id],
    ),
  );

  // Derive the selected field from the live payload so a change in status that
  // removes the field (or replaces the payload) never leaves a stale selection.
  const selectedField: ExtractedFieldView | null = React.useMemo(() => {
    if (selectedFieldIndex === null) return null;
    return liveReferral.extractedPayload[selectedFieldIndex] ?? null;
  }, [liveReferral.extractedPayload, selectedFieldIndex]);

  return (
    <ReferralDetailLayout
      header={<ReferralDetailHeader referral={liveReferral} />}
    >
      <div
        className={cn(
          "grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_430px]",
        )}
      >
        <PdfViewer
          referral={liveReferral}
          selectedField={selectedField}
          selectedFieldIndex={selectedFieldIndex}
          removeHighlightSelection={() => setSelectedFieldIndex(null)}
          className="md:col-start-1 md:row-start-1"
        />
        <ExtractedFieldsPanel
          referral={liveReferral}
          selectedFieldIndex={selectedFieldIndex}
          onSelectField={(index) => setSelectedFieldIndex(index)}
          className="md:col-start-2 md:row-start-1"
        />
      </div>
    </ReferralDetailLayout>
  );
}
