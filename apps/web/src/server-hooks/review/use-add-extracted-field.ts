"use client";

import { useCallback } from "react";

import { useServerAction } from "@/hooks/use-server-action";
import type { NewReviewerFieldInput } from "@/managers/extracted-field-correction.manager";
import { addExtractedField } from "@/server-actions/referrals";
import type { ReferralDetailView } from "@/types/referrals/referral";

export interface UseAddExtractedFieldOptions {
  referralId: string;
  /** Runs synchronously inside the action's transition, so `useOptimistic` updates apply instantly. */
  onOptimisticApply?: (newField: NewReviewerFieldInput) => void;
  onSuccess?: (referral: ReferralDetailView) => void;
  onError?: (message: string) => void;
}

export function useAddExtractedField({
  referralId,
  onOptimisticApply,
  onSuccess,
  onError,
}: UseAddExtractedFieldOptions) {
  const action = useCallback(
    (newField: NewReviewerFieldInput) => {
      onOptimisticApply?.(newField);
      return addExtractedField(referralId, newField);
    },
    [referralId, onOptimisticApply],
  );

  return useServerAction(action, { onSuccess, onError });
}
