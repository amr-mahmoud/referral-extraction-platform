import type { AcceptedUploadCandidate } from "@/managers/upload-candidate.manager";

/** One presigned upload slot returned by `POST /referrals`, flattened to strings. */
export interface ReferralUploadSlot {
  referralId: string;
  fileName: string;
  uploadUrl: string;
  expiresAt: string;
}

/**
 * Pairs each presigned slot with the local candidate it belongs to, by file
 * name — both sides are already name-unique within one batch (the backend
 * response is also in request order, so index matching would agree too;
 * matching by name is the more explicit, self-documenting mechanism).
 *
 * Pure data-correlation only — the actual upload (axios PUT + progress) is
 * owned entirely by `useCustomUploadFilesToPresignedUrlsWithProgress`.
 */
export function matchSlotsToCandidates(
  slots: readonly ReferralUploadSlot[],
  candidates: readonly AcceptedUploadCandidate[],
): Array<{ candidate: AcceptedUploadCandidate; slot: ReferralUploadSlot }> {
  const slotsByFileName = new Map(slots.map((slot) => [slot.fileName, slot]));

  return candidates.flatMap((candidate) => {
    const slot = slotsByFileName.get(candidate.name);
    return slot ? [{ candidate, slot }] : [];
  });
}
