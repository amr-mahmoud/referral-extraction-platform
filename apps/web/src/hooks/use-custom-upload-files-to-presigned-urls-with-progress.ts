"use client";

import axios from "axios";
import { useCallback, useRef, useState } from "react";

import { REFERRAL_ACCEPTED_MIME_TYPE } from "@/constants/referrals";
import {
  matchSlotsToCandidates,
  type ReferralUploadSlot,
} from "@/managers/direct-upload.manager";
import type { AcceptedUploadCandidate } from "@/managers/upload-candidate.manager";

/** Min gap between progress re-renders per file — XHR ticks fire far faster than the UI needs, and unthrottled they saturate the main thread and delay clicks elsewhere on the page. */
const PROGRESS_UPDATE_THROTTLE_MILLISECONDS = 150;

export type FileUploadPhaseStatus = "idle" | "uploading" | "done" | "error";

export interface FileUploadProgress {
  status: FileUploadPhaseStatus;
  /** 0-100 — real bytes-sent progress from axios's `onUploadProgress`, not just a start/finish flag. */
  percent: number;
  error?: string;
}

export interface UploadOutcome {
  candidateId: string;
  fileName: string;
  referralId?: string;
  status: "success" | "error";
  error?: string;
}

export interface UseCustomUploadFilesToPresignedUrlsWithProgressResult {
  /** Per-file progress, keyed by candidate id. */
  progressByFileId: Record<string, FileUploadProgress>;
  /** Average of every file's own percent — equal weight per file regardless of size. */
  overallPercent: number;
  /** PUTs every matched (slot, candidate) pair directly to S3, concurrently, via axios. */
  upload: (
    slots: readonly ReferralUploadSlot[],
    candidates: readonly AcceptedUploadCandidate[],
  ) => Promise<UploadOutcome[]>;
  reset: () => void;
}

/** PUTs every file to its presigned S3 URL with live per-file progress. In `hooks/`, not `server-hooks/`: wraps a browser upload, not a Server Action. */
export function useCustomUploadFilesToPresignedUrlsWithProgress(): UseCustomUploadFilesToPresignedUrlsWithProgressResult {
  const [progressByFileId, setProgressByFileId] = useState<
    Record<string, FileUploadProgress>
  >({});

  /** Last percent/timestamp committed to state per candidate id — a ref so reading it never forces a render. */
  const lastCommittedProgressByFileId = useRef<
    Record<string, { percent: number; timestampMs: number }>
  >({});

  const reset = useCallback(() => {
    setProgressByFileId({});
    lastCommittedProgressByFileId.current = {};
  }, []);

  /** Throttle guard for `onUploadProgress`: true (and records the new baseline) only if the percent changed and either the window elapsed or it's the final 100%. */
  const shouldCommitThrottledUploadProgressUpdate = useCallback(
    (candidateId: string, percent: number): boolean => {
      const lastCommitted = lastCommittedProgressByFileId.current[candidateId];
      const hasPercentActuallyChanged =
        lastCommitted === undefined || lastCommitted.percent !== percent;
      const hasThrottleWindowElapsed =
        lastCommitted === undefined ||
        Date.now() - lastCommitted.timestampMs >=
          PROGRESS_UPDATE_THROTTLE_MILLISECONDS;

      const shouldCommit =
        hasPercentActuallyChanged &&
        (hasThrottleWindowElapsed || percent === 100);

      if (shouldCommit) {
        lastCommittedProgressByFileId.current[candidateId] = {
          percent,
          timestampMs: Date.now(),
        };
      }

      return shouldCommit;
    },
    [],
  );

  const uploadOne = useCallback(
    async (
      candidate: AcceptedUploadCandidate,
      slot: ReferralUploadSlot,
    ): Promise<UploadOutcome> => {
      try {
        await axios.put(slot.uploadUrl, candidate.file, {
          headers: {
            // Must match what was signed into the URL, not the browser-sniffed MIME — a mismatch is a 403 SignatureDoesNotMatch.
            "Content-Type": REFERRAL_ACCEPTED_MIME_TYPE,
          },
          onUploadProgress: (progressEvent) => {
            const percent = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;

            if (
              !shouldCommitThrottledUploadProgressUpdate(candidate.id, percent)
            ) {
              return;
            }

            setProgressByFileId((current) => ({
              ...current,
              [candidate.id]: { status: "uploading", percent },
            }));
          },
        });

        setProgressByFileId((current) => ({
          ...current,
          [candidate.id]: { status: "done", percent: 100 },
        }));

        return {
          candidateId: candidate.id,
          fileName: candidate.name,
          referralId: slot.referralId,
          status: "success",
        };
      } catch {
        const message = "Upload failed. Please try again.";

        // Keep the last-reached percent rather than snapping back to 0.
        setProgressByFileId((current) => ({
          ...current,
          [candidate.id]: {
            ...current[candidate.id],
            status: "error",
            error: message,
          },
        }));

        return {
          candidateId: candidate.id,
          fileName: candidate.name,
          status: "error",
          error: message,
        };
      }
    },
    [shouldCommitThrottledUploadProgressUpdate],
  );

  const upload = useCallback(
    async (
      slots: readonly ReferralUploadSlot[],
      candidates: readonly AcceptedUploadCandidate[],
    ): Promise<UploadOutcome[]> => {
      const pairs = matchSlotsToCandidates(slots, candidates);

      setProgressByFileId((current) => {
        const next = { ...current };
        for (const { candidate } of pairs) {
          next[candidate.id] = { status: "uploading", percent: 0 };
        }
        return next;
      });

      return Promise.all(
        pairs.map(({ candidate, slot }) => uploadOne(candidate, slot)),
      );
    },
    [uploadOne],
  );

  const entries = Object.values(progressByFileId);
  const overallPercent =
    entries.length === 0
      ? 0
      : Math.round(
          entries.reduce((total, entry) => total + entry.percent, 0) /
            entries.length,
        );

  return { progressByFileId, overallPercent, upload, reset };
}
