"use client";

import axios from "axios";
import { useCallback, useState } from "react";

import { REFERRAL_ACCEPTED_MIME_TYPE } from "@/constants/referrals";
import {
  matchSlotsToCandidates,
  type ReferralUploadSlot,
} from "@/managers/direct-upload.manager";
import type { AcceptedUploadCandidate } from "@/managers/upload-candidate.manager";

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
  /**
   * Average of every file's own percent — equal weight per file regardless
   * of size. For 2 files, each is worth 50% of this number: one file at 20%
   * with the other untouched reads as 10% overall.
   */
  overallPercent: number;
  /** PUTs every matched (slot, candidate) pair directly to S3, concurrently, via axios. */
  upload: (
    slots: readonly ReferralUploadSlot[],
    candidates: readonly AcceptedUploadCandidate[],
  ) => Promise<UploadOutcome[]>;
  reset: () => void;
}

/**
 * Owns the entire browser-side "PUT every file to its presigned S3 URL, with
 * live per-file progress" concern in one place — the axios call, the
 * progress math, and the state — so a caller just hands it (slots,
 * candidates) and reads back progress. Lives in `hooks/`, not
 * `server-hooks/`: it wraps a browser upload, not a Server Action.
 */
export function useCustomUploadFilesToPresignedUrlsWithProgress(): UseCustomUploadFilesToPresignedUrlsWithProgressResult {
  const [progressByFileId, setProgressByFileId] = useState<
    Record<string, FileUploadProgress>
  >({});

  const reset = useCallback(() => {
    setProgressByFileId({});
  }, []);

  const uploadOne = useCallback(
    async (
      candidate: AcceptedUploadCandidate,
      slot: ReferralUploadSlot,
    ): Promise<UploadOutcome> => {
      try {
        await axios.put(slot.uploadUrl, candidate.file, {
          headers: {
            // Must exactly match what the backend signed into the URL —
            // S3StorageService bakes ContentType: 'application/pdf' into the
            // SigV4 signature, so this can never be `candidate.file.type`
            // (the browser-sniffed MIME): any mismatch gets a
            // 403 SignatureDoesNotMatch from S3.
            "Content-Type": REFERRAL_ACCEPTED_MIME_TYPE,
          },
          onUploadProgress: (progressEvent) => {
            const percent = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0;
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

        // Keep whatever percent it last reached rather than snapping back to
        // 0 — the failure is conveyed by `status`/`error`, not by erasing
        // the progress the file actually made.
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
    [],
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
