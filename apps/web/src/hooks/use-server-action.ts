"use client";

import { useCallback, useState, useTransition } from "react";

import type { ActionResult } from "@/types/server-action";

export interface UseServerActionOptions<TData> {
  onSuccess?: (data: TData) => void;
  onError?: (error: string) => void;
}

export interface UseServerActionResult<TInput, TData> {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  data: TData | null;
  error: string | null;
  execute: (input: TInput) => void;
  reset: () => void;
}

const FALLBACK_ERROR = "Something went wrong. Please try again.";

/**
 * Generic foundation every domain mutation hook in `server-hooks/` builds on:
 * wraps a Server Action in a transition and exposes the loading / error /
 * success contract the UI reads, so components never touch the action directly.
 */
export function useServerAction<TInput, TData>(
  action: (input: TInput) => Promise<ActionResult<TData>>,
  options: UseServerActionOptions<TData> = {},
): UseServerActionResult<TInput, TData> {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { onError, onSuccess } = options;

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsSuccess(false);
  }, []);

  const execute = useCallback(
    (input: TInput) => {
      setError(null);
      setIsSuccess(false);

      startTransition(async () => {
        const result = await action(input);

        if (result.success && result.data !== undefined) {
          setData(result.data);
          setIsSuccess(true);
          onSuccess?.(result.data);
          return;
        }

        const message = result.error ?? FALLBACK_ERROR;
        setError(message);
        onError?.(message);
      });
    },
    [action, onError, onSuccess],
  );

  return {
    isLoading: isPending,
    isError: error !== null,
    isSuccess,
    data,
    error,
    execute,
    reset,
  };
}
