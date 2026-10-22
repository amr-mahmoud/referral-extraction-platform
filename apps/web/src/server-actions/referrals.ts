"use server";

import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";

import { apiClient } from "@/client/api-client";
import { ACCESS_TOKEN_COOKIE } from "@/constants/auth";
import { getApiErrorMessage } from "@/lib/api-error";
import {
  type ExtractedFieldCorrectionInput,
  type NewReviewerFieldInput,
} from "@/managers/extracted-field-correction.manager";
import {
  toReferralDetailView,
  toReferralRowView,
  type ReferralListItemDto,
} from "@/managers/referral-view.manager";
import { SCHEMA_SOURCES, type SchemaSelection } from "@/types/extraction-schemas/schema";
import type { ActionResult } from "@/types/server-action";
import type {
  ReferralDetailView,
  ReferralRowView,
} from "@/types/referrals/referral";
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

  try {
    const { data, response } = await apiClient.GET("/referrals", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok || !data) return [];

    const now = Date.now();
    return data.map((referral) => toReferralRowView(referral, now));
  } catch {
    // A temporarily-unreachable API must never crash the dashboard — the
    // table renders empty until the connection recovers.
    return [];
  }
}

/**
 * Read side of the review screen: `GET /referrals/{id}`, the single-referral
 * form of the same cache-aside read the list already uses — the API serves
 * it from the referral's own Redis hash on a hit, falling back to Postgres
 * on a miss, rather than the client filtering the full list for one id.
 *
 * Returns `null` when the id doesn't belong to this clinic (or is unknown —
 * the API returns 404 for both, so a foreign id can't be distinguished from
 * a nonexistent one) so the page can call `notFound()`.
 */
export async function getReferralDetailById(
  referralId: string,
): Promise<ReferralDetailView | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (!token) return null;

  try {
    const { data, response } = await apiClient.GET("/referrals/{id}", {
      params: { path: { id: referralId } },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok || !data) return null;

    return toReferralDetailView(data, Date.now());
  } catch {
    // A temporarily-unreachable API must not 500 the review page — treat it
    // like an unknown id so the page renders its not-found state instead.
    return null;
  }
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

    // No `revalidatePath` here, deliberately: the Postgres NOTIFY trigger
    // fires on INSERT as well as status UPDATE, so these new PENDING rows
    // already reach the client over the open SSE stream in real time.
    // Forcing a full RSC re-render here used to race that stream — a
    // dashboard refresh would re-run `getReferralRows()` against whatever
    // Postgres looked like at THIS instant (before any file had even started
    // uploading), and if that stale snapshot's response landed after SSE had
    // already pushed a later status, it would overwrite the live table back
    // to PENDING until SSE caught back up — a visible flicker on every
    // multi-file batch.

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

const REFERRAL_CACHE_TAG = "referral";

type CorrectionApiResult = {
  data?: ReferralListItemDto;
  error?: unknown;
  response: Response;
};

/** Maps a correction endpoint's response (full referral detail) to the review view. */
function toCorrectionActionResult({
  data,
  error,
  response,
}: CorrectionApiResult): ActionResult<ReferralDetailView> {
  if (!response.ok || !data) {
    return {
      success: false,
      error: getApiErrorMessage(
        error,
        `Correction could not be saved (${response.status})`,
      ),
    };
  }

  revalidateTag(REFERRAL_CACHE_TAG, "max");
  return { success: true, data: toReferralDetailView(data, Date.now()) };
}

async function withCorrectionAuthorization(
  send: (headers: { Authorization: string }) => Promise<CorrectionApiResult>,
): Promise<ActionResult<ReferralDetailView>> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    if (!token) return { success: false, error: "Not authenticated" };

    return toCorrectionActionResult(await send({ Authorization: `Bearer ${token}` }));
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Correction could not be saved. Please try again.",
    };
  }
}

export async function correctExtractedField(
  referralId: string,
  fieldKey: string,
  correction: ExtractedFieldCorrectionInput,
): Promise<ActionResult<ReferralDetailView>> {
  return withCorrectionAuthorization((headers) =>
    apiClient.PATCH("/referrals/{id}/fields/{fieldKey}", {
      params: { path: { id: referralId, fieldKey } },
      headers,
      body: correction,
    }),
  );
}

export async function addExtractedField(
  referralId: string,
  newField: NewReviewerFieldInput,
): Promise<ActionResult<ReferralDetailView>> {
  return withCorrectionAuthorization((headers) =>
    apiClient.POST("/referrals/{id}/fields", {
      params: { path: { id: referralId } },
      headers,
      body: newField,
    }),
  );
}

export async function revertExtractedField(
  referralId: string,
  fieldKey: string,
): Promise<ActionResult<ReferralDetailView>> {
  return withCorrectionAuthorization((headers) =>
    apiClient.POST("/referrals/{id}/fields/{fieldKey}/revert", {
      params: { path: { id: referralId, fieldKey } },
      headers,
    }),
  );
}
