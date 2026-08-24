import {
  REFERRAL_ACCEPTED_EXTENSION,
  REFERRAL_ACCEPTED_MIME_TYPE,
  REFERRAL_MAX_FILE_BYTES,
} from "@/constants/referrals";
import { formatFileSize } from "@/lib/format";

export const UPLOAD_REJECTION_REASONS = {
  NOT_A_PDF: "not a PDF — rejected",
  TOO_LARGE: "over 20 MB — rejected",
  DUPLICATE: "already queued — skipped",
} as const;

export type UploadRejectionReason =
  (typeof UPLOAD_REJECTION_REASONS)[keyof typeof UPLOAD_REJECTION_REASONS];

interface UploadCandidateBase {
  /** Stable across re-renders so React keys and removal stay correct. */
  id: string;
  name: string;
}

export interface AcceptedUploadCandidate extends UploadCandidateBase {
  status: "accepted";
  sizeLabel: string;
  file: File;
}

export interface RejectedUploadCandidate extends UploadCandidateBase {
  status: "rejected";
  reason: UploadRejectionReason;
}

export type UploadCandidate = AcceptedUploadCandidate | RejectedUploadCandidate;

export function isAcceptedCandidate(
  candidate: UploadCandidate,
): candidate is AcceptedUploadCandidate {
  return candidate.status === "accepted";
}

function isPdf(file: File): boolean {
  return (
    file.type === REFERRAL_ACCEPTED_MIME_TYPE ||
    file.name.toLowerCase().endsWith(REFERRAL_ACCEPTED_EXTENSION)
  );
}

function rejectionReasonFor(file: File): UploadRejectionReason | null {
  if (!isPdf(file)) return UPLOAD_REJECTION_REASONS.NOT_A_PDF;
  if (file.size > REFERRAL_MAX_FILE_BYTES) return UPLOAD_REJECTION_REASONS.TOO_LARGE;
  return null;
}

/**
 * Screen a batch of dropped files against the upload contract, returning one
 * candidate per file so the dropzone can show accepted and rejected chips side
 * by side rather than silently discarding what it will not send.
 *
 * `existing` is passed in rather than read from a store: this keeps the rule —
 * "a name already queued is a duplicate" — a pure function of its inputs.
 */
export function screenUploadCandidates(
  files: readonly File[],
  existing: readonly UploadCandidate[] = [],
): UploadCandidate[] {
  const seen = new Set(existing.map((candidate) => candidate.name));

  return files.map((file, index) => {
    const id = `${file.name}-${file.lastModified}-${index}-${Date.now()}`;
    const reason = seen.has(file.name)
      ? UPLOAD_REJECTION_REASONS.DUPLICATE
      : rejectionReasonFor(file);

    seen.add(file.name);

    if (reason) {
      return { id, name: file.name, status: "rejected", reason };
    }

    return {
      id,
      name: file.name,
      status: "accepted",
      sizeLabel: formatFileSize(file.size),
      file,
    };
  });
}
