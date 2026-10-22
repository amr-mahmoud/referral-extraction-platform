"use client";

import { useCallback } from "react";

import { useServerAction } from "@/hooks/use-server-action";
import { revertExtractedField } from "@/server-actions/referrals";
import type { ReferralDetailView } from "@/types/referrals/referral";

export interface UseRevertExtractedFieldOptions {
  referralId: string;
  /** Runs synchronously inside the action's transition, so `useOptimistic` updates apply instantly. */
  onOptimisticApply?: (fieldKey: string) => void;
  onSuccess?: (referral: ReferralDetailView) => void;
  onError?: (message: string) => void;
}

export function useRevertExtractedField({
  referralId,
  onOptimisticApply,
  onSuccess,
  onError,
}: UseRevertExtractedFieldOptions) {
  const action = useCallback(
    (fieldKey: string) => {
      onOptimisticApply?.(fieldKey);
      return revertExtractedField(referralId, fieldKey);
    },
    [referralId, onOptimisticApply],
  );

  return useServerAction(action, { onSuccess, onError });
}
