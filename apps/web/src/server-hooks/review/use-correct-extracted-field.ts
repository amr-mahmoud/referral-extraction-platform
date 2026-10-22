"use client";

import { useCallback } from "react";

import { useServerAction } from "@/hooks/use-server-action";
import type { ExtractedFieldCorrectionInput } from "@/managers/extracted-field-correction.manager";
import { correctExtractedField } from "@/server-actions/referrals";
import type { ReferralDetailView } from "@/types/referrals/referral";

export interface UseCorrectExtractedFieldOptions {
  referralId: string;
  /** Runs synchronously inside the action's transition, so `useOptimistic` updates apply instantly. */
  onOptimisticApply?: (fieldKey: string, correction: ExtractedFieldCorrectionInput) => void;
  onSuccess?: (referral: ReferralDetailView) => void;
  onError?: (message: string) => void;
}

export function useCorrectExtractedField({
  referralId,
  onOptimisticApply,
  onSuccess,
  onError,
}: UseCorrectExtractedFieldOptions) {
  const action = useCallback(
    (input: { fieldKey: string; correction: ExtractedFieldCorrectionInput }) => {
      onOptimisticApply?.(input.fieldKey, input.correction);
      return correctExtractedField(referralId, input.fieldKey, input.correction);
    },
    [referralId, onOptimisticApply],
  );

  return useServerAction(action, { onSuccess, onError });
}
