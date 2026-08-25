import { formatRelativeTime } from "@/lib/format";
import type { components } from "@/types/api.generated";
import type { ReferralRowView, ReferralStatus } from "@/types/referrals/referral";

export type ReferralListItemDto = components["schemas"]["ReferralListItemDto"];

function toSchemaLabel(dto: ReferralListItemDto): string {
  return dto.extractionSchemaVersion != null
    ? `Custom schema v${dto.extractionSchemaVersion}`
    : "Default (LLM)";
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
    status: dto.status as ReferralStatus,
    submittedLabel: formatRelativeTime(dto.createdAt, now),
  };
}

/**
 * Cache-aside merge for the live table: replace the row by id if already
 * present, otherwise insert as the newest row. Mirrors the same "targeted
 * update, not a full refetch" principle the backend's Redis cache-aside path
 * uses for the list itself.
 */
export function mergeReferralRowView(
  rows: readonly ReferralRowView[],
  incoming: ReferralRowView,
): ReferralRowView[] {
  const existingIndex = rows.findIndex((row) => row.id === incoming.id);

  if (existingIndex === -1) {
    return [incoming, ...rows];
  }

  const next = [...rows];
  next[existingIndex] = incoming;
  return next;
}
