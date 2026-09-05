import { useMemo } from "react";
import { create } from "zustand";

/**
 * Client-only "Uploading" state, managed in a single store so the upload
 * workspace (which drives the PUTs) and the dashboard table (which renders
 * the rows) stay in sync without prop-drilling.
 *
 * The server has no `UPLOADING` status — a batch-created referral row is
 * `PENDING` the moment `POST /referrals` returns, while the browser is still
 * pushing bytes to S3. This store records which of those rows are still
 * mid-PUT so the table can overlay an "Uploading" pill instead of a
 * misleading "Pending" one until each file's upload settles.
 */

export interface ReferralUploadStoreState {
  /**
   * Referral ids whose PDF is still being PUT to S3 by this browser tab.
   * Empty array = nothing uploading.
   */
  uploadingReferralIds: readonly string[];
  /**
   * Begins tracking a batch the moment its presigned slots are issued, so the
   * table can show the new rows as "Uploading" before their PUTs finish.
   * Unioned with any ids already tracked so a new batch can't clobber an
   * in-flight one.
   */
  registerUploadingReferralIds: (referralIds: readonly string[]) => void;
  /** Stops tracking a batch once every PUT has settled (success or error). */
  clearUploadedReferralIds: (referralIds: readonly string[]) => void;
  /** Emergency reset — e.g. an aborted batch that never produced slots. */
  clearAllUploadingReferralIds: () => void;
}

function removeReferralIds(
  referralIds: readonly string[],
  referralIdsToRemove: readonly string[],
): string[] {
  if (referralIdsToRemove.length === 0) return [...referralIds];
  const referralIdsToRemoveSet = new Set(referralIdsToRemove);
  return referralIds.filter(
    (referralId) => !referralIdsToRemoveSet.has(referralId),
  );
}

export const useReferralUploadStore = create<ReferralUploadStoreState>(
  (set) => ({
    uploadingReferralIds: [],
    registerUploadingReferralIds: (referralIds) =>
      set((currentState) => ({
        uploadingReferralIds: Array.from(
          new Set([...currentState.uploadingReferralIds, ...referralIds]),
        ),
      })),
    clearUploadedReferralIds: (referralIds) =>
      set((currentState) => ({
        uploadingReferralIds: removeReferralIds(
          currentState.uploadingReferralIds,
          referralIds,
        ),
      })),
    clearAllUploadingReferralIds: () =>
      set({ uploadingReferralIds: [] }),
  }),
);

/**
 * The ids of every referral whose PDF this tab is still uploading, as a Set
 * for O(1) membership checks. The memo key is the store slice's array
 * reference, so a fresh Set is only built when the store actually changes.
 */
export function useUploadingReferralIds(): ReadonlySet<string> {
  const uploadingReferralIds = useReferralUploadStore(
    (state) => state.uploadingReferralIds,
  );
  return useMemo(() => new Set(uploadingReferralIds), [uploadingReferralIds]);
}
