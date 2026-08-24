"use server";

import { revalidatePath } from "next/cache";

import {
  fetchReferrals,
  fetchThroughputStats,
  submitReferralUpload,
  type MockUploadAcceptance,
  type ThroughputStats,
} from "@/client/mock-api";
import { formatRelativeTime } from "@/lib/format";
import { ROUTES } from "@/routes";
import type { SchemaSelection } from "@/types/extraction-schemas/schema";
import type { ActionResult } from "@/types/server-action";
import type { ReferralRowView } from "@/types/referrals/referral";

/**
 * Read side of the dashboard. Relative timestamps are resolved here, at the
 * server boundary, so the table receives finished strings — a client component
 * re-deriving them from `Date.now()` would render one value on the server and a
 * different one on hydration.
 */
export async function getReferralRows(): Promise<readonly ReferralRowView[]> {
  const referrals = await fetchReferrals();
  const now = Date.now();

  return referrals.map(({ submittedAt, ...referral }) => ({
    ...referral,
    submittedLabel: formatRelativeTime(submittedAt, now),
  }));
}

export async function getThroughputStats(): Promise<ThroughputStats> {
  return fetchThroughputStats();
}

export interface CreateReferralsInput {
  fileNames: string[];
  schema: SchemaSelection;
}

/**
 * Write side. Real implementation will request presigned S3 URLs, PUT each file
 * directly, and let the `ObjectCreated` → SQS → worker path take over; for now
 * it acknowledges the batch so the UI can exercise its pending/success states.
 */
export async function createReferrals(
  input: CreateReferralsInput,
): Promise<ActionResult<MockUploadAcceptance>> {
  if (input.fileNames.length === 0) {
    return { success: false, error: "Add at least one referral PDF to upload." };
  }

  try {
    const data = await submitReferralUpload(input.fileNames);

    // Refresh the dashboard's RSC payload so the new rows are picked up on the
    // next render. Once the reads move behind `"use cache"` + `cacheTag`, this
    // becomes a tag-scoped `revalidateTag` instead of a whole-route purge.
    revalidatePath(ROUTES.DASHBOARD);

    return { success: true, data };
  } catch {
    return {
      success: false,
      error: "Upload could not be started. Please try again.",
    };
  }
}
