"use client";

import { useCallback, useMemo, useState } from "react";

import {
  SCHEMA_SOURCES,
  type CustomSchemaField,
  type SavedSchema,
  type SchemaSelection,
  type SchemaSource,
} from "@/types/extraction-schemas/schema";

export interface UseSchemaSelectionResult {
  source: SchemaSource;
  savedSchemaId: string | undefined;
  schemaFileName: string | undefined;
  /** Set once the field-builder modal has been confirmed at least once. */
  customFields: CustomSchemaField[];
  /** The selection as the upload action wants it. */
  selection: SchemaSelection;
  /** How the chosen schema should read in the referrals table. */
  schemaLabel: string;
  /** False while a source is chosen but its required input is still empty. */
  isComplete: boolean;
  setSource: (source: SchemaSource) => void;
  setSavedSchemaId: (id: string) => void;
  setSchemaFileName: (fileName: string | undefined) => void;
  /** Confirms fields from the builder modal and switches the active source to `BUILT`. */
  confirmCustomFields: (fields: CustomSchemaField[]) => void;
}

/**
 * Owns which extraction schema an upload will run under. Kept as a hook because
 * the three sources are mutually exclusive but each carries its own payload —
 * a saved id, an uploaded filename — and only the active one may be submitted.
 */
export function useSchemaSelection(
  savedSchemas: readonly SavedSchema[],
): UseSchemaSelectionResult {
  const [source, setSource] = useState<SchemaSource>(SCHEMA_SOURCES.DEFAULT);
  const [savedSchemaId, setSavedSchemaId] = useState<string | undefined>(
    savedSchemas[0]?.id,
  );
  const [schemaFileName, setSchemaFileName] = useState<string | undefined>();
  const [customFields, setCustomFields] = useState<CustomSchemaField[]>([]);

  const selection = useMemo<SchemaSelection>(() => {
    if (source === SCHEMA_SOURCES.SAVED) return { source, savedSchemaId };
    if (source === SCHEMA_SOURCES.UPLOAD) return { source, schemaFileName };
    if (source === SCHEMA_SOURCES.BUILT) return { source, customFields };
    return { source };
  }, [customFields, savedSchemaId, schemaFileName, source]);

  const schemaLabel = useMemo(() => {
    if (source === SCHEMA_SOURCES.SAVED) {
      const match = savedSchemas.find((schema) => schema.id === savedSchemaId);
      return match?.name ?? "Saved schema";
    }
    if (source === SCHEMA_SOURCES.UPLOAD) return schemaFileName ?? "Uploaded schema";
    if (source === SCHEMA_SOURCES.BUILT) {
      return `Custom (${customFields.length} field${customFields.length === 1 ? "" : "s"})`;
    }
    return "Default (LLM)";
  }, [customFields, savedSchemaId, savedSchemas, schemaFileName, source]);

  const isComplete =
    source === SCHEMA_SOURCES.DEFAULT ||
    (source === SCHEMA_SOURCES.SAVED && Boolean(savedSchemaId)) ||
    (source === SCHEMA_SOURCES.UPLOAD && Boolean(schemaFileName)) ||
    (source === SCHEMA_SOURCES.BUILT && customFields.length > 0);

  return {
    source,
    savedSchemaId,
    schemaFileName,
    customFields,
    selection,
    schemaLabel,
    isComplete,
    setSource: useCallback((next: SchemaSource) => setSource(next), []),
    setSavedSchemaId: useCallback((id: string) => setSavedSchemaId(id), []),
    setSchemaFileName: useCallback(
      (fileName: string | undefined) => setSchemaFileName(fileName),
      [],
    ),
    confirmCustomFields: useCallback((fields: CustomSchemaField[]) => {
      setCustomFields(fields);
      setSource(SCHEMA_SOURCES.BUILT);
    }, []),
  };
}
