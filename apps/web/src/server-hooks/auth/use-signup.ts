"use client";

import { useRouter } from "next/navigation";
import { useServerAction } from "@/hooks/use-server-action";
import { ROUTES } from "@/routes";
import {
  signupAction,
  type AuthResponse,
  type SignupInput,
} from "@/server-actions/auth";

export interface UseSignupOptions {
  onSuccess?: (data: AuthResponse) => void;
  onError?: (error: string) => void;
}

/**
 * Domain hook for registering a new clinic user.
 * Consumes signupAction, manages transition states, and redirects to dashboard upon success.
 */
export function useSignup(options: UseSignupOptions = {}) {
  const router = useRouter();

  return useServerAction<SignupInput, AuthResponse>(signupAction, {
    onSuccess: (data) => {
      options.onSuccess?.(data);
      router.push(ROUTES.DASHBOARD);
      router.refresh();
    },
    onError: options.onError,
  });
}
