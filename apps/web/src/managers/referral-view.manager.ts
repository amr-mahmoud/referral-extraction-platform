import { formatRelativeTime } from "@/lib/format";
import type { components } from "@/types/api.generated";
import {
  CLIENT_REFERRAL_STATUSES,
  REFERRAL_STATUSES,
} from "@/types/referrals/referral";
import type {
  ReferralDetailView,
  ReferralDisplayRowView,
  ReferralDisplayStatus,
  ReferralRowView,
  ReferralStatus,
} from "@/types/referrals/referral";

export type ReferralListItemDto = components["schemas"]["ReferralListItemDto"];

function toSchemaLabel(dto: ReferralListItemDto): string {
  if (dto.extractionSchemaTitle != null) {
    return dto.extractionSchemaTitle;
  }
  return dto.extractionSchemaVersion != null
    ? `Custom schema v${dto.extractionSchemaVersion}`
    : "Default (LLM)";
}

function toStatus(dto: ReferralListItemDto): ReferralStatus {
  return dto.status as ReferralStatus;
}

/**
 * The "# extractions" column value: populated only once extraction completed —
 * before that there is no count to report, and the row renders "N/A".
 */
function toExtractionCount(dto: ReferralListItemDto): number | null {
  return dto.status === REFERRAL_STATUSES.COMPLETED
    ? dto.extractedPayload.length
    : null;
}

/**
 * Maps the API's read model to what the table renders. Shared between the
 * initial server-side fetch (`getReferralRows`) and the client-side SSE
 * stream (`useReferralStatusStream`) so both produce identical rows —
 * `now` is threaded through explicitly so the server can resolve it once at
 * request time while the client resolves it at merge time.
 */
export function toReferralRowView(
  dto: ReferralListItemDto,
  now: number = Date.now(),
): ReferralRowView {
  return {
    id: dto.id,
    patientName: dto.patientName,
    fileName: dto.fileName,
    schemaLabel: toSchemaLabel(dto),
    status: toStatus(dto),
    extractionCount: toExtractionCount(dto),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    submittedLabel: formatRelativeTime(dto.createdAt, now),
  };
}

/**
 * Maps the API's read model to the detail screen's view. Served from the SAME
 * list/SSE payload as the dashboard — no per-id fetch exists (see
 * `getReferralDetailById`), which is why the status is re-derived here the same
 * way the row mapper does rather than read from a dedicated endpoint.
 */
export function toReferralDetailView(
  dto: ReferralListItemDto,
  now: number = Date.now(),
): ReferralDetailView {
  return {
    id: dto.id,
    patientName: dto.patientName,
    fileName: dto.fileName,
    schemaLabel: toSchemaLabel(dto),
    status: toStatus(dto),
    submittedLabel: formatRelativeTime(dto.createdAt, now),
    errorMessage: dto.errorMessage,
    documentUrl: dto.documentUrl,
    extractedPayload: dto.extractedPayload,
  };
}

/**
 * Cache-aside merge for the live table: replace the row by id if already
 * present, otherwise insert it in its `createdAt`-sorted position (newest
 * first) rather than blindly prepending — an SSE event for an older referral
 * must not jump the queue ahead of newer rows.
 *
 * The replace is guarded by `updatedAt`: a row can legitimately reach the
 * client from two independent channels (a server-rendered/refreshed list,
 * and the SSE stream) with no guaranteed ordering between them, so an
 * arrival that's actually older than what's already showing is dropped
 * rather than allowed to regress the displayed status.
 */
export function mergeReferralRowView(
  rows: readonly ReferralRowView[],
  incoming: ReferralRowView,
): ReferralRowView[] {
  const existingIndex = rows.findIndex((row) => row.id === incoming.id);

  if (existingIndex !== -1) {
    if (rows[existingIndex].updatedAt > incoming.updatedAt) {
      return [...rows];
    }
    const next = [...rows];
    next[existingIndex] = incoming;
    return next;
  }

  const insertIndex = rows.findIndex(
    (row) => row.createdAt < incoming.createdAt,
  );
  if (insertIndex === -1) {
    return [...rows, incoming];
  }
  const next = [...rows];
  next.splice(insertIndex, 0, incoming);
  return next;
}

/**
 * Folds a full snapshot (e.g. a fresh `getReferralRows()` result) into the
 * live table state one row at a time via `mergeReferralRowView`, rather than
 * replacing the array outright — see that function for why a wholesale
 * replace is unsafe here.
 */
export function mergeReferralRowViews(
  rows: readonly ReferralRowView[],
  incoming: readonly ReferralRowView[],
): ReferralRowView[] {
  return incoming.reduce(
    (current, row) => mergeReferralRowView(current, row),
    [...rows],
  );
}

/**
 * True when a row's PDF is still being PUT to S3 by this browser tab.
 * Guarded on the server status too: "Uploading" only makes sense while the
 * referral is still `PENDING` server-side — once SSE has moved a row to
 * `PROCESSING`/terminal the object already exists, so any stale store entry
 * must not hold the row hostage in an overlay.
 */
export function isReferralCurrentlyUploading(
  referral: Pick<ReferralRowView, "id" | "status">,
  uploadingReferralIds: ReadonlySet<string>,
): boolean {
  return (
    referral.status === REFERRAL_STATUSES.PENDING &&
    uploadingReferralIds.has(referral.id)
  );
}

/**
 * The status a row should present right now: the client-only `UPLOADING`
 * overlay when the PDF is still being PUT to S3, otherwise the server status.
 */
export function toReferralDisplayStatus(
  referral: Pick<ReferralRowView, "id" | "status">,
  uploadingReferralIds: ReadonlySet<string>,
): ReferralDisplayStatus {
  return isReferralCurrentlyUploading(referral, uploadingReferralIds)
    ? CLIENT_REFERRAL_STATUSES.UPLOADING
    : referral.status;
}

/**
 * Overlays the client-only upload state onto server rows so the whole table
 * pipeline (filters, tab counts, pills) sees `UPLOADING` as a normal status
 * for the duration of a PUT. The server rows themselves are untouched — this
 * is a pure render-time projection, and the raw `PENDING` status is what SSE
 * merges keep operating on.
 */
export function toReferralRowDisplayViews(
  referrals: readonly ReferralRowView[],
  uploadingReferralIds: ReadonlySet<string>,
): ReferralDisplayRowView[] {
  return referrals.map((referral) => ({
    ...referral,
    status: toReferralDisplayStatus(referral, uploadingReferralIds),
  }));
}

/**
 * Guaranteed presentation order for the table: newest first by `createdAt`.
 * ISO-8601 UTC strings compare lexicographically, so a plain string compare is
 * correct. Applied defensively before rendering so the UI stays ordered no
 * matter what order the API list or the SSE stream happens to deliver rows in.
 * Generic over any row shape carrying `createdAt` (server rows and the
 * display projection built from them both sort identically).
 */
export function sortReferralRowsNewestFirst<
  TReferralRow extends { createdAt: string },
>(rows: readonly TReferralRow[]): TReferralRow[] {
  return [...rows].sort((left, right) =>
    right.createdAt.localeCompare(left.createdAt),
  );
}
