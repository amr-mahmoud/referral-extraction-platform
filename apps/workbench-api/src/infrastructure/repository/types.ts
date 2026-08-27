import type { Prisma } from '@prisma/client';

/** One stored extracted field, as read back from the `extracted_payload` JSONB column. */
export interface RawExtractedField {
  key: string;
  label: string;
  value: string;
  pageNumber: number;
  boundingBox: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  } | null;
}

/** The raw row shape behind the shared `CACHED_REFERRAL_SELECT` projection. */
export interface CachedReferralRow {
  id: string;
  clinicId: string;
  fileName: string;
  patientName: string | null;
  status: string;
  extractionSchemaId: string | null;
  errorMessage: string | null;
  extractedPayload: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  extractionSchema: { version: number; title: string | null } | null;
}
