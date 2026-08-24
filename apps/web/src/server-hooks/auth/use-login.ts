"use client";

import { useRouter } from "next/navigation";
import { useServerAction } from "@/hooks/use-server-action";
import { ROUTES } from "@/routes";
import {
  loginAction,
  type AuthResponse,
  type LoginInput,
} from "@/server-actions/auth";

export interface UseLoginOptions {
  onSuccess?: (data: AuthResponse) => void;
  onError?: (error: string) => void;
}

/**
 * Domain hook for authenticating an existing clinic user.
 * Consumes loginAction, manages transition states, and redirects to dashboard upon success.
 */
export function useLogin(options: UseLoginOptions = {}) {
  const router = useRouter();

  return useServerAction<LoginInput, AuthResponse>(loginAction, {
    onSuccess: (data) => {
      options.onSuccess?.(data);
      router.push(ROUTES.DASHBOARD);
      router.refresh();
    },
    onError: options.onError,
  });
}
