import type { CustomSchemaField } from "@/types/extraction-schemas/schema";

/** A field row in the builder — carries a stable id so rows survive reorder-free add/remove. */
export interface CustomFieldDraft extends CustomSchemaField {
  id: string;
}

function generateFieldId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `field-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createEmptyCustomField(): CustomFieldDraft {
  return { id: generateFieldId(), name: "", description: "" };
}

/**
 * Trims every row and drops the ones with no name — an untouched placeholder
 * row (or one where the user only typed a description) isn't a real field.
 */
export function sanitizeCustomFields(
  fields: readonly CustomFieldDraft[],
): CustomSchemaField[] {
  return fields
    .map((field) => ({
      name: field.name.trim(),
      description: field.description.trim(),
    }))
    .filter((field) => field.name.length > 0);
}
