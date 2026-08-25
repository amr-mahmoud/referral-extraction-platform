"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";

import { useCustomUploadFilesToPresignedUrlsWithProgress } from "@/hooks/use-custom-upload-files-to-presigned-urls-with-progress";
import type { AcceptedUploadCandidate } from "@/managers/upload-candidate.manager";
import { createReferrals } from "@/server-actions/referrals";
import type { SchemaSelection } from "@/types/extraction-schemas/schema";

/** How long the "Documents uploaded" state holds before the button resets. */
const COMPLETE_HOLD_MS = 500;

export type UploadPhase = "idle" | "creating" | "uploading" | "complete";

export interface UseCreateReferralsOptions {
  /** Fires once per file the moment ITS PUT succeeds, so the caller can dequeue just that one. */
  onFileUploaded?: (candidateId: string) => void;
}

export interface UseCreateReferralsResult {
  /** Spans both phases: the batch POST and the last PUT settling. */
  isLoading: boolean;
  /** True only for a batch-level failure — the POST /referrals call itself failed. */
  isError: boolean;
  error: string | null;
  fileStatus: ReturnType<
    typeof useCustomUploadFilesToPresignedUrlsWithProgress
  >["progressByFileId"];
  /** Drives the submit button's progress-bar presentation. */
  phase: UploadPhase;
  /** 0-100, real bytes-sent progress averaged equally across every file in the batch. */
  progressPercent: number;
  /** True once any file in the current batch has failed to upload. */
  hasErrors: boolean;
  execute: (input: {
    candidates: AcceptedUploadCandidate[];
    schema: SchemaSelection;
  }) => void;
  reset: () => void;
}

/**
 * Two-phase orchestrator: (1) call the `createReferrals` Server Action to
 * create the referral rows and get back presigned upload slots, then
 * (2) PUT every file straight to S3 from the browser.
 *
 * Deliberately does NOT wrap the generic `useServerAction` — that hook's
 * `execute` fires-and-forgets a single action call and its `isLoading` flips
 * false the instant the action resolves, before any S3 PUT has even started.
 * A two-phase flow needs its own state that spans both phases. Still lives
 * in `server-hooks/` because its primary identity is "the hook that wraps
 * the `createReferrals` Server Action" — the entire PUT-with-progress phase
 * is delegated to `hooks/use-custom-upload-files-to-presigned-urls-with-progress`,
 * not reimplemented here.
 */
export function useCreateReferrals(
  options?: UseCreateReferralsOptions,
): UseCreateReferralsResult {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const uploads = useCustomUploadFilesToPresignedUrlsWithProgress();
  const completeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { onFileUploaded } = options ?? {};

  useEffect(() => {
    return () => {
      if (completeTimeoutRef.current) clearTimeout(completeTimeoutRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    if (completeTimeoutRef.current) clearTimeout(completeTimeoutRef.current);
    setError(null);
    setPhase("idle");
    uploads.reset();
  }, [uploads]);

  const execute = useCallback(
    (input: { candidates: AcceptedUploadCandidate[]; schema: SchemaSelection }) => {
      if (completeTimeoutRef.current) clearTimeout(completeTimeoutRef.current);
      setError(null);
      // Cleared up front, not just at the start of a fresh batch — a prior
      // batch's progress must not leak into this one's average, which is
      // scoped to whatever's currently in `uploads.progressByFileId`.
      uploads.reset();
      setPhase("creating");

      startTransition(async () => {
        const result = await createReferrals({
          files: input.candidates.map((candidate) => ({
            fileName: candidate.name,
          })),
          schema: input.schema,
        });

        if (!result.success || !result.data) {
          setPhase("idle");
          setError(result.error ?? "Upload could not be started. Please try again.");
          return;
        }

        setPhase("uploading");

        const outcomes = await uploads.upload(result.data.slots, input.candidates);

        for (const outcome of outcomes) {
          if (outcome.status === "success") {
            onFileUploaded?.(outcome.candidateId);
          }
        }

        setPhase("complete");
        completeTimeoutRef.current = setTimeout(() => {
          setPhase("idle");
        }, COMPLETE_HOLD_MS);
      });
    },
    [uploads, onFileUploaded],
  );

  const hasErrors = useMemo(
    () =>
      Object.values(uploads.progressByFileId).some(
        (entry) => entry.status === "error",
      ),
    [uploads.progressByFileId],
  );

  const progressPercent = phase === "complete" ? 100 : uploads.overallPercent;

  return {
    isLoading: isPending || phase !== "idle",
    isError: error !== null,
    error,
    fileStatus: uploads.progressByFileId,
    phase,
    progressPercent,
    hasErrors,
    execute,
    reset,
  };
}
