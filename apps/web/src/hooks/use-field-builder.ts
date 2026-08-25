"use client";

import { useCallback, useState } from "react";

import {
  createEmptyCustomField,
  sanitizeCustomFields,
  type CustomFieldDraft,
} from "@/managers/custom-field.manager";
import type { CustomSchemaField } from "@/types/extraction-schemas/schema";

const STARTER_ROW_COUNT = 2;

export interface UseFieldBuilderResult {
  fields: CustomFieldDraft[];
  error: string | null;
  /** Count of rows that would actually be sent (blank rows don't count). */
  fieldCount: number;
  updateField: (id: string, patch: Partial<Pick<CustomFieldDraft, "name" | "description">>) => void;
  addField: () => void;
  removeField: (id: string) => void;
  /** Validates and returns the sanitized fields, or null (and sets `error`) if none are named. */
  validate: () => CustomSchemaField[] | null;
}

/**
 * Owns one field-builder session: the draft rows and their validation.
 * Every confirm publishes a new schema, so a fresh instance — always two
 * blank starter rows — is exactly right; there's no prior draft to resume.
 */
export function useFieldBuilder(): UseFieldBuilderResult {
  const [fields, setFields] = useState<CustomFieldDraft[]>(() =>
    Array.from({ length: STARTER_ROW_COUNT }, createEmptyCustomField),
  );
  const [error, setError] = useState<string | null>(null);

  const updateField = useCallback(
    (id: string, patch: Partial<Pick<CustomFieldDraft, "name" | "description">>) => {
      setFields((current) =>
        current.map((field) => (field.id === id ? { ...field, ...patch } : field)),
      );
    },
    [],
  );

  const addField = useCallback(() => {
    setFields((current) => [...current, createEmptyCustomField()]);
  }, []);

  const removeField = useCallback((id: string) => {
    setFields((current) => current.filter((field) => field.id !== id));
  }, []);

  const validate = useCallback((): CustomSchemaField[] | null => {
    const sanitized = sanitizeCustomFields(fields);
    if (sanitized.length === 0) {
      setError("Add at least one field with a name.");
      return null;
    }
    setError(null);
    return sanitized;
  }, [fields]);

  return {
    fields,
    error,
    fieldCount: sanitizeCustomFields(fields).length,
    updateField,
    addField,
    removeField,
    validate,
  };
}
