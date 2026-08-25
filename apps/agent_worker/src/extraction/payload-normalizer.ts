import { z } from 'zod';
import type {
  ExtractedFieldPayload,
  NormalizedBoundingBox,
  NormalizedExtractionResult,
  RawExtractedField,
  RawLlmOutput,
} from '../types/extraction.types';

const rawExtractedFieldSchema = z.object({
  fieldName: z.coerce.string().min(1),
  fieldValue: z.coerce.string(),
  pageNumber: z.coerce.number().int().min(1),
  boundingBox: z.unknown().nullable().optional(),
});

const rawLlmOutputSchema = z.object({
  isValidDocument: z.boolean(),
  rejectionReason: z.string().nullable().optional(),
  extractedFields: z.array(rawExtractedFieldSchema),
});

export function normalizeExtractionOutput(raw: unknown): NormalizedExtractionResult {
  const parsed = rawLlmOutputSchema.parse(raw) as unknown as RawLlmOutput;

  const extractedFields: ExtractedFieldPayload[] = parsed.extractedFields.map(
    (field) => ({
      value: field.fieldValue,
      pageNumber: field.pageNumber,
      boundingBox: sanitizeBoundingBox(field.boundingBox),
    }),
  );

  return {
    isValidDocument: parsed.isValidDocument,
    rejectionReason: parsed.rejectionReason ?? null,
    extractedFields,
    patientName: derivePatientName(parsed.extractedFields),
  };
}

function sanitizeBoundingBox(raw: unknown): NormalizedBoundingBox | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }
  const box = raw as Partial<NormalizedBoundingBox>;
  const coordinates = [box.xmin, box.ymin, box.xmax, box.ymax];
  const isWithinNormalizedRange = coordinates.every(
    (coordinate) =>
      typeof coordinate === 'number' &&
      Number.isFinite(coordinate) &&
      coordinate >= 0 &&
      coordinate <= 1000,
  );
  if (!isWithinNormalizedRange || box.xmin! > box.xmax! || box.ymin! > box.ymax!) {
    return null;
  }
  return { xmin: box.xmin!, ymin: box.ymin!, xmax: box.xmax!, ymax: box.ymax! };
}

function isPatientNameField(fieldName: string): boolean {
  const normalized = fieldName.toLowerCase();
  return (
    normalized === 'patient_name' ||
    normalized === 'patient name' ||
    normalized === 'patient' ||
    (normalized.includes('patient') && normalized.includes('name'))
  );
}

function derivePatientName(fields: RawExtractedField[]): string | null {
  const patientNameField = fields.find((field) => isPatientNameField(field.fieldName));
  return patientNameField?.fieldValue ?? null;
}
