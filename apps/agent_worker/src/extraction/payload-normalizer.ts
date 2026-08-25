import { z } from 'zod';
import type {
  ExtractedFieldPayload,
  NormalizedBoundingBox,
  NormalizedExtractionResult,
  RawBoundingBoxArray,
  RawExtractedField,
  RawLlmOutput,
} from '../types/extraction.types';

const rawExtractedFieldSchema = z.object({
  fieldName: z.string().min(1),
  fieldValue: z.string(),
  pageNumber: z.number().int().min(1),
  boundingBox: z.array(z.number()).nullable().optional(),
});

const rawLlmOutputSchema = z.object({
  isValidDocument: z.boolean(),
  rejectionReason: z.string().nullable().optional(),
  extractedFields: z.array(rawExtractedFieldSchema),
});

const PATIENT_NAME_FIELD_KEYS = new Set(['patient_name', 'patient name', 'patient']);

export function normalizeExtractionOutput(raw: unknown): NormalizedExtractionResult {
  const parsed = rawLlmOutputSchema.parse(raw) as RawLlmOutput;

  const extractedFields: ExtractedFieldPayload[] = parsed.extractedFields.map(
    (field) => ({
      value: field.fieldValue,
      pageNumber: field.pageNumber,
      boundingBox: normalizeBoundingBox(field.boundingBox),
    }),
  );

  return {
    isValidDocument: parsed.isValidDocument,
    rejectionReason: parsed.rejectionReason ?? null,
    extractedFields,
    patientName: derivePatientName(parsed.extractedFields),
  };
}

function normalizeBoundingBox(
  rawBoundingBox: RawBoundingBoxArray | null | undefined,
): NormalizedBoundingBox | null {
  if (!rawBoundingBox || rawBoundingBox.length !== 4) {
    return null;
  }
  const [ymin, xmin, ymax, xmax] = rawBoundingBox;
  const isWithinNormalizedRange = [ymin, xmin, ymax, xmax].every(
    (coordinate) => coordinate >= 0 && coordinate <= 1000,
  );
  if (!isWithinNormalizedRange || ymin > ymax || xmin > xmax) {
    return null;
  }
  return { xmin, ymin, xmax, ymax };
}

function derivePatientName(fields: RawExtractedField[]): string | null {
  const patientNameField = fields.find((field) =>
    PATIENT_NAME_FIELD_KEYS.has(field.fieldName.toLowerCase()),
  );
  return patientNameField?.fieldValue ?? null;
}
