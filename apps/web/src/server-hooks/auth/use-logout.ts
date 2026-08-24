"use client";

import { useRouter } from "next/navigation";

import { useServerAction } from "@/hooks/use-server-action";
import { ROUTES } from "@/routes";
import { logoutAction } from "@/server-actions/auth";

export interface UseLogoutOptions {
  onError?: (error: string) => void;
}

/**
 * Domain hook for ending the clinic session: clears the `access_token` cookie
 * server-side via `logoutAction`, then sends the browser back to `/auth`.
 */
export function useLogout(options: UseLogoutOptions = {}) {
  const router = useRouter();

  return useServerAction<void, null>(logoutAction, {
    onSuccess: () => {
      router.push(ROUTES.AUTH);
      router.refresh();
    },
    onError: options.onError,
  });
}
