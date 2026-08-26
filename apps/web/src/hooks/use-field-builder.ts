"use client";

import { useCallback, useState } from "react";

import {
  createEmptyCustomField,
  sanitizeCustomFields,
  type CustomFieldDraft,
} from "@/managers/custom-field.manager";
import type { CustomSchemaField } from "@/types/extraction-schemas/schema";

const STARTER_ROW_COUNT = 2;

/** What a confirmed builder session produces — a titled field set, ready to publish. */
export interface BuildSchemaDraft {
  title: string;
  fields: CustomSchemaField[];
}

export interface UseFieldBuilderResult {
  title: string;
  fields: CustomFieldDraft[];
  error: string | null;
  /** Count of rows that would actually be sent (blank rows don't count). */
  fieldCount: number;
  setTitle: (title: string) => void;
  updateField: (id: string, patch: Partial<Pick<CustomFieldDraft, "name" | "description">>) => void;
  addField: () => void;
  removeField: (id: string) => void;
  /** Validates and returns the titled, sanitized draft, or null (and sets `error`). */
  validate: () => BuildSchemaDraft | null;
}

/**
 * Owns one field-builder session: the draft rows, the version title, and their
 * validation. Every confirm publishes a new schema, so a fresh instance —
 * always two blank starter rows — is exactly right; there's no prior draft to
 * resume.
 */
export function useFieldBuilder(): UseFieldBuilderResult {
  const [title, setTitle] = useState("");
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

  const validate = useCallback((): BuildSchemaDraft | null => {
    const sanitizedTitle = title.trim();
    const sanitized = sanitizeCustomFields(fields);

    if (sanitizedTitle.length === 0) {
      setError("Give the schema a version name before publishing.");
      return null;
    }
    if (sanitized.length === 0) {
      setError("Add at least one field with a name.");
      return null;
    }

    setError(null);
    return { title: sanitizedTitle, fields: sanitized };
  }, [fields, title]);

  return {
    title,
    fields,
    error,
    fieldCount: sanitizeCustomFields(fields).length,
    setTitle,
    updateField,
    addField,
    removeField,
    validate,
  };
}
