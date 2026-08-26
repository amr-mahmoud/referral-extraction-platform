"use client";

import { useCallback, useMemo, useState } from "react";

import {
  SCHEMA_SOURCES,
  type SavedSchema,
  type SchemaSelection,
  type SchemaSource,
} from "@/types/extraction-schemas/schema";

export interface UploadedSchema {
  id: string;
  fileName: string;
}

export interface UseSchemaSelectionResult {
  source: SchemaSource;
  savedSchemaId: string | undefined;
  /** The selection as the upload action wants it. */
  selection: SchemaSelection;
  /** How the chosen schema should read in the referrals table. */
  schemaLabel: string;
  /** False while a source is chosen but its required input is still empty. */
  isComplete: boolean;
  setSource: (source: SchemaSource) => void;
  setSavedSchemaId: (id: string) => void;
  /** Selects a schema just published from the field builder modal (built manually or uploaded as JSON) and switches to `SAVED`. */
  confirmSavedSchema: (id: string) => void;
}

/**
 * Owns which extraction schema an upload will run under. Kept as a hook
 * because the sources are mutually exclusive but `SAVED` carries its own
 * payload (an id) that only matters while it's the active source. Every
 * source resolves to a schema id the database already has — the field
 * builder modal publishes to `POST /extraction-schemas` the moment a schema
 * is confirmed (built manually or uploaded as JSON), so there is no "local
 * only" schema for a referral to be submitted against.
 */
export function useSchemaSelection(
  savedSchemas: readonly SavedSchema[],
): UseSchemaSelectionResult {
  const [source, setSource] = useState<SchemaSource>(SCHEMA_SOURCES.DEFAULT);
  const [savedSchemaId, setSavedSchemaId] = useState<string | undefined>(
    savedSchemas[0]?.id,
  );

  const selection = useMemo<SchemaSelection>(() => {
    if (source === SCHEMA_SOURCES.SAVED) return { source, savedSchemaId };
    return { source };
  }, [savedSchemaId, source]);

  const schemaLabel = useMemo(() => {
    if (source === SCHEMA_SOURCES.SAVED) {
      const match = savedSchemas.find((schema) => schema.id === savedSchemaId);
      return match?.name ?? "Saved schema";
    }
    return "Default (LLM)";
  }, [savedSchemaId, savedSchemas, source]);

  const isComplete =
    source === SCHEMA_SOURCES.DEFAULT ||
    (source === SCHEMA_SOURCES.SAVED && Boolean(savedSchemaId));

  const confirmSavedSchema = useCallback((id: string) => {
    setSavedSchemaId(id);
    setSource(SCHEMA_SOURCES.SAVED);
  }, []);

  return {
    source,
    savedSchemaId,
    selection,
    schemaLabel,
    isComplete,
    setSource: useCallback((next: SchemaSource) => setSource(next), []),
    setSavedSchemaId: useCallback((id: string) => setSavedSchemaId(id), []),
    confirmSavedSchema,
  };
}
