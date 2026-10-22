import {
  EXTRACTED_FIELD_SOURCES,
  type ExtractedFieldView,
} from "@/types/referrals/referral";

export interface ExtractedFieldCorrectionInput {
  /** New key; omitted when the reviewer left the key alone. */
  key?: string;
  label?: string;
  value: string;
}

export interface NewReviewerFieldInput {
  key: string;
  label: string;
  value: string;
}

const SNAKE_CASE_KEY_PATTERN = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

/**
 * Client-side mirror of the API's key rules (lower snake_case, unique within
 * the referral) so an obviously bad key is rejected before a round trip.
 * Returns the message to show, or `null` when the key is acceptable.
 * `fieldIndexBeingEdited` exempts the field's own current key from the
 * duplicate check.
 */
export function findExtractedFieldKeyError(
  candidateKey: string,
  fields: readonly ExtractedFieldView[],
  fieldIndexBeingEdited: number | null,
): string | null {
  if (!SNAKE_CASE_KEY_PATTERN.test(candidateKey)) {
    return "Key must be lower snake_case, e.g. patient_name.";
  }

  const isDuplicate = fields.some(
    (field, index) =>
      index !== fieldIndexBeingEdited && field.key === candidateKey,
  );
  return isDuplicate ? `A field with key "${candidateKey}" already exists.` : null;
}

/**
 * Applies a reviewer correction to one field. The first edit snapshots the AI
 * value; later edits keep that first snapshot, and an edit that lands back on
 * the snapshot returns the field to its untouched AI state.
 */
export function applyFieldCorrection(
  fields: readonly ExtractedFieldView[],
  fieldKey: string,
  correction: ExtractedFieldCorrectionInput,
  correctedAtIso: string = new Date().toISOString(),
): ExtractedFieldView[] {
  const targetIndex = fields.findIndex((field) => field.key === fieldKey);
  return fields.map((field, index) => {
    if (index !== targetIndex) return field;

    const aiOriginal = field.aiOriginal ?? {
      key: field.key,
      label: field.label,
      value: field.value,
    };
    const corrected = {
      key: correction.key ?? field.key,
      label: correction.label ?? field.label,
      value: correction.value,
    };

    const isBackToAiOriginal =
      field.source === EXTRACTED_FIELD_SOURCES.AI &&
      corrected.key === aiOriginal.key &&
      corrected.label === aiOriginal.label &&
      corrected.value === aiOriginal.value;

    return {
      ...field,
      ...corrected,
      aiOriginal: isBackToAiOriginal ? null : aiOriginal,
      correctedAt: isBackToAiOriginal ? null : correctedAtIso,
    };
  });
}

/** Appends a reviewer-added field, which has no PDF location. */
export function applyReviewerFieldAddition(
  fields: readonly ExtractedFieldView[],
  newField: NewReviewerFieldInput,
  correctedAtIso: string = new Date().toISOString(),
): ExtractedFieldView[] {
  return [
    ...fields,
    {
      ...newField,
      pageNumber: null,
      boundingBox: null,
      source: EXTRACTED_FIELD_SOURCES.REVIEWER,
      aiOriginal: null,
      correctedAt: correctedAtIso,
    },
  ];
}

/** Restores an edited AI field to its first AI value and clears its provenance. */
export function applyFieldRevert(
  fields: readonly ExtractedFieldView[],
  fieldKey: string,
): ExtractedFieldView[] {
  const targetIndex = fields.findIndex((field) => field.key === fieldKey);
  return fields.map((field, index) => {
    if (index !== targetIndex || field.aiOriginal === null) return field;
    return {
      ...field,
      ...field.aiOriginal,
      aiOriginal: null,
      correctedAt: null,
    };
  });
}
