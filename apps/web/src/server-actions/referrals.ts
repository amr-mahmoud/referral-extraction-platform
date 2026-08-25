"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { apiClient } from "@/client/api-client";
import { ACCESS_TOKEN_COOKIE } from "@/constants/auth";
import { getApiErrorMessage } from "@/lib/api-error";
import { toReferralRowView } from "@/managers/referral-view.manager";
import { ROUTES } from "@/routes";
import { SCHEMA_SOURCES, type SchemaSelection } from "@/types/extraction-schemas/schema";
import type { ActionResult } from "@/types/server-action";
import type { ReferralRowView } from "@/types/referrals/referral";
import type { ReferralUploadSlot } from "@/managers/direct-upload.manager";

/**
 * Read side of the dashboard. Relative timestamps are resolved here, at the
 * server boundary, so the table receives finished strings — a client component
 * re-deriving them from `Date.now()` would render one value on the server and a
 * different one on hydration. Live changes after the initial paint arrive
 * separately over SSE (`useReferralStatusStream`), not by re-calling this.
 */
export async function getReferralRows(): Promise<readonly ReferralRowView[]> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return [];

  const { data, response } = await apiClient.GET("/referrals", {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok || !data) return [];

  const now = Date.now();
  return data.map((referral) => toReferralRowView(referral, now));
}

export interface CreateReferralsInput {
  files: { fileName: string }[];
  schema: SchemaSelection;
}

export interface CreateReferralsBatchResult {
  slots: ReferralUploadSlot[];
}

function resolveExtractionSchemaId(selection: SchemaSelection): string | null {
  if (selection.source === SCHEMA_SOURCES.SAVED) {
    return selection.savedSchemaId ?? null;
  }
  if (selection.source === SCHEMA_SOURCES.UPLOAD) {
    return selection.uploadedSchemaId ?? null;
  }
  return null;
}

/**
 * Write side: creates one referral per file in a single batch request and
 * returns their presigned S3 upload slots. Does NOT upload any bytes itself —
 * the actual PUT to S3 happens client-side (see
 * `useCustomUploadFilesToPresignedUrlsWithProgress`), so
 * the Next.js server never becomes a bandwidth bottleneck for the files
 * themselves.
 */
export async function createReferrals(
  input: CreateReferralsInput,
): Promise<ActionResult<CreateReferralsBatchResult>> {
  if (input.files.length === 0) {
    return { success: false, error: "Add at least one referral PDF to upload." };
  }

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error, response } = await apiClient.POST("/referrals", {
      headers: { Authorization: `Bearer ${token}` },
      body: {
        files: input.files,
        extractionSchemaId: resolveExtractionSchemaId(input.schema),
      },
    });

    if (!response.ok || !data) {
      return {
        success: false,
        error: getApiErrorMessage(error, `Upload could not be started (${response.status})`),
      };
    }

    // Rows are real and in AWAITING_UPLOAD the moment this POST succeeds,
    // independent of whether the client-side PUTs that follow succeed — so
    // revalidating here is correct regardless of upload outcome.
    revalidatePath(ROUTES.DASHBOARD);

    return {
      success: true,
      data: {
        slots: data.map((item) => ({
          referralId: item.referral.id,
          fileName: item.referral.fileName,
          uploadUrl: item.upload.url,
          expiresAt: item.upload.expiresAt,
        })),
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Upload could not be started. Please try again.",
    };
  }
}
