import type { ExtractedFieldPayload } from './extraction.types';

export interface CachedExtractionSchema {
  id: string;
  version: number;
  title: string;
  schemaDefinition: { key: string; label: string; description: string }[];
}

export interface ReferralJobContext {
  referralId: string;
  clinicId: string;
  bucket: string;
  key: string;
}

export type ReferralJobResult =
  | { kind: 'COMPLETED' }
  | { kind: 'REJECTED'; reason: string }
  | { kind: 'SKIPPED'; reason: string };

/**
 * The result event the worker publishes to SQS_STATUS_UPDATE_URL. The worker
 * publishes a `PROCESSING` event when it claims a referral, then exactly one
 * terminal event (`COMPLETED`, `REJECTED`, or `FAILED`). The workbench API
 * consumes these and applies the idempotent DB transition, which in turn
 * fires the LISTEN/NOTIFY ping that pushes the SSE update — the worker never
 * touches Postgres.
 */
export type ReferralStatusUpdateEvent = {
  referralId: string;
  clinicId: string;
  status: 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'FAILED';
  extractedPayload: ExtractedFieldPayload[];
  patientName: string | null;
  extractionSchemaId: string | null;
  errorMessage: string | null;
  extractedAt: string;
};
