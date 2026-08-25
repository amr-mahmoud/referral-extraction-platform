import type { CustomSchemaField } from "@/types/extraction-schemas/schema";

/**
 * Client-side mirror of the WorkBench API's `normalizeExtractionSchemaFields`
 * (`apps/workbench-api/src/interface/http/dto/extraction-schema-input.mapper.ts`).
 *
 * Same split as the backend: this only checks *shape* — is it an array of
 * field objects, or a flat `name -> description` map — so a malformed upload
 * fails instantly, before a network round trip. Semantic rules (a field needs
 * a non-empty name, no duplicate keys) stay server-side in the domain, which
 * remains the single source of truth for them; `useUploadSchemaJson` surfaces
 * those as the server action's `error` once submitted.
 */
export type SchemaJsonValidationResult =
  | { valid: true; fields: CustomSchemaField[] }
  | { valid: false; error: string };

export function validateExtractionSchemaJson(
  parsed: unknown,
): SchemaJsonValidationResult {
  if (Array.isArray(parsed)) {
    return normalizeFieldArray(parsed);
  }

  if (isPlainObject(parsed)) {
    return normalizeFieldMap(parsed);
  }

  return {
    valid: false,
    error:
      "Expected an array of fields or an object mapping field names to descriptions.",
  };
}

function normalizeFieldArray(entries: unknown[]): SchemaJsonValidationResult {
  const fields: CustomSchemaField[] = [];

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];

    if (!isPlainObject(entry)) {
      return { valid: false, error: `Field at index ${index} must be an object.` };
    }

    const name = entry.name ?? entry.key ?? entry.label;
    if (name !== undefined && typeof name !== "string") {
      return {
        valid: false,
        error: `Field at index ${index} has an invalid name.`,
      };
    }

    const { description } = entry;
    if (description !== undefined && typeof description !== "string") {
      return {
        valid: false,
        error: `Field at index ${index} has an invalid description.`,
      };
    }

    fields.push({
      name: typeof name === "string" ? name : "",
      description: typeof description === "string" ? description : "",
    });
  }

  return { valid: true, fields };
}

function normalizeFieldMap(
  map: Record<string, unknown>,
): SchemaJsonValidationResult {
  const fields: CustomSchemaField[] = [];

  for (const [name, description] of Object.entries(map)) {
    if (typeof description !== "string") {
      return {
        valid: false,
        error: `Field '${name}' must map to a description string.`,
      };
    }
    fields.push({ name, description });
  }

  return { valid: true, fields };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
