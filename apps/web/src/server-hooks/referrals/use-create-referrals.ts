"use client";

import {
  createReferrals,
  type CreateReferralsInput,
} from "@/server-actions/referrals";
import {
  useServerAction,
  type UseServerActionOptions,
  type UseServerActionResult,
} from "@/hooks/use-server-action";
import type { MockUploadAcceptance } from "@/client/mock-api";

export type UseCreateReferralsResult = UseServerActionResult<
  CreateReferralsInput,
  MockUploadAcceptance
>;

/** Domain wrapper around the `createReferrals` Server Action. */
export function useCreateReferrals(
  options?: UseServerActionOptions<MockUploadAcceptance>,
): UseCreateReferralsResult {
  return useServerAction(createReferrals, options);
}
