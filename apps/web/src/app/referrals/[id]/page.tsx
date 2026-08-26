import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReferralDetailApp } from "@/apps/referral-detail";
import { requireAuth } from "@/server-actions/auth";
import { getReferralDetailById } from "@/server-actions/referrals";

// Served from `GET /referrals` (cache-aside, always fresh-enough for a single
// view) plus the live SSE stream — force-dynamic so the presigned document URL
// is never rendered stale from a cached page.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Referral Review · Referral Extraction Workbench",
  description:
    "Review extracted referral fields against the source PDF, with click-to-highlight source locations.",
};

interface ReferralDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReferralDetailPage({
  params,
}: ReferralDetailPageProps) {
  await requireAuth();
  const { id } = await params;
  const referral = await getReferralDetailById(id);

  if (!referral) {
    // Wrong clinic or unknown id — the backend never surfaces foreign ids, so a
    // miss here means "not yours", which 404s rather than rendering someone
    // else's referral.
    notFound();
  }

  return <ReferralDetailApp referral={referral} />;
}
