import {
  REFERRAL_STATUSES,
  type ReferralSummary,
} from "@/types/referrals/referral";

/**
 * Stand-in for the typed `openapi-fetch` client.
 *
 * The WorkBench API has no referral or schema endpoints yet, so this module
 * fakes the two reads and the one write the dashboard needs. It lives in
 * `client/` — the folder that owns "how we reach the backend" — so swapping it
 * for the real client is a change to this file and the `server-actions/` that
 * call it, and nothing in `features/`.
 */

const MINUTE_MS = 60_000;

/** Anchored to module load so successive renders don't re-roll the timestamps. */
const NOW = Date.now();

function minutesAgo(minutes: number): string {
  return new Date(NOW - minutes * MINUTE_MS).toISOString();
}

const REFERRALS: readonly ReferralSummary[] = [
  {
    id: "ref_4471",
    patientName: "Linda Marsh",
    fileName: "referral_4471.pdf",
    schemaLabel: "Derm intake v3",
    status: REFERRAL_STATUSES.COMPLETED,
    submittedAt: minutesAgo(2),
  },
  {
    id: "ref_4470",
    patientName: "Marcus Bell",
    fileName: "referral_4470.pdf",
    schemaLabel: "Default (LLM)",
    status: REFERRAL_STATUSES.PROCESSING,
    submittedAt: minutesAgo(3),
  },
  {
    id: "ref_4469",
    patientName: "Aiko Tanaka",
    fileName: "referral_4469.pdf",
    schemaLabel: "Derm intake v3",
    status: REFERRAL_STATUSES.COMPLETED,
    submittedAt: minutesAgo(11),
  },
  {
    id: "ref_4468",
    patientName: null,
    fileName: "fax_inbound_88.pdf",
    schemaLabel: "Default (LLM)",
    status: REFERRAL_STATUSES.FAILED,
    submittedAt: minutesAgo(18),
  },
  {
    id: "ref_4467",
    patientName: "Rosa Delgado",
    fileName: "referral_4468.pdf",
    schemaLabel: "custom.json",
    status: REFERRAL_STATUSES.PENDING,
    submittedAt: minutesAgo(24),
  },
  {
    id: "ref_4466",
    patientName: "Devon Pryce",
    fileName: "referral_4466.pdf",
    schemaLabel: "Derm intake v3",
    status: REFERRAL_STATUSES.COMPLETED,
    submittedAt: minutesAgo(41),
  },
  {
    id: "ref_4465",
    patientName: "Hannah Okafor",
    fileName: "referral_4465.pdf",
    schemaLabel: "Default (LLM)",
    status: REFERRAL_STATUSES.PROCESSING,
    submittedAt: minutesAgo(56),
  },
];

/** Weekly throughput strip above the header. */
export interface ThroughputStats {
  referralsThisWeek: number;
  averageSeconds: number;
}

const THROUGHPUT: ThroughputStats = {
  referralsThisWeek: 1284,
  averageSeconds: 3.2,
};

export const CLINIC_NAME = "Hamzavi Dermatology";

function delay<TValue>(value: TValue, ms = 120): Promise<TValue> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export function fetchReferrals(): Promise<readonly ReferralSummary[]> {
  return delay(REFERRALS);
}

export function fetchThroughputStats(): Promise<ThroughputStats> {
  return delay(THROUGHPUT);
}

export interface MockUploadAcceptance {
  acceptedCount: number;
  /** Ids the API would hand back for polling / SSE subscription. */
  referralIds: string[];
}

export function submitReferralUpload(
  fileNames: readonly string[],
): Promise<MockUploadAcceptance> {
  return delay(
    {
      acceptedCount: fileNames.length,
      referralIds: fileNames.map((_, index) => `ref_pending_${index}`),
    },
    600,
  );
}
