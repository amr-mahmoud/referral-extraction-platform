"use client";

import { useCallback, useState } from "react";

import {
  createEmptyCustomField,
  sanitizeCustomFields,
  type CustomFieldDraft,
} from "@/managers/custom-field.manager";
import type { CustomSchemaField } from "@/types/extraction-schemas/schema";

const STARTER_ROW_COUNT = 2;

function seedFields(initial: readonly CustomSchemaField[] | undefined): CustomFieldDraft[] {
  if (initial && initial.length > 0) {
    return initial.map((field) => ({ ...createEmptyCustomField(), ...field }));
  }
  return Array.from({ length: STARTER_ROW_COUNT }, createEmptyCustomField);
}

export interface UseFieldBuilderOptions {
  initialFields?: readonly CustomSchemaField[];
  initialSaveAsSchema?: boolean;
}

export interface UseFieldBuilderResult {
  fields: CustomFieldDraft[];
  saveAsSchema: boolean;
  setSaveAsSchema: (value: boolean) => void;
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
 * Owns one field-builder session: the draft rows, the save-as-schema toggle,
 * and validation. Meant to be used by a component that only mounts while the
 * modal is open, so a fresh instance — reseeded from `initialFields` — is
 * exactly what "cancel discards, reopening resumes the last confirmed set"
 * requires, with no extra reset plumbing.
 */
export function useFieldBuilder({
  initialFields,
  initialSaveAsSchema,
}: UseFieldBuilderOptions = {}): UseFieldBuilderResult {
  const [fields, setFields] = useState<CustomFieldDraft[]>(() => seedFields(initialFields));
  const [saveAsSchema, setSaveAsSchema] = useState(initialSaveAsSchema ?? false);
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
    saveAsSchema,
    setSaveAsSchema,
    error,
    fieldCount: sanitizeCustomFields(fields).length,
    updateField,
    addField,
    removeField,
    validate,
  };
}
