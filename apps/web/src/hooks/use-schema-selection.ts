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
  uploadedSchema: UploadedSchema | undefined;
  /** The selection as the upload action wants it. */
  selection: SchemaSelection;
  /** How the chosen schema should read in the referrals table. */
  schemaLabel: string;
  /** False while a source is chosen but its required input is still empty. */
  isComplete: boolean;
  setSource: (source: SchemaSource) => void;
  setSavedSchemaId: (id: string) => void;
  /** Records a JSON file once it has been validated and persisted; `undefined` clears it. */
  setUploadedSchema: (schema: UploadedSchema | undefined) => void;
  /** Selects a schema just published from the field builder and switches to `SAVED`. */
  confirmSavedSchema: (id: string) => void;
}

/**
 * Owns which extraction schema an upload will run under. Kept as a hook because
 * the sources are mutually exclusive but each carries its own payload — a
 * saved id, a persisted upload — and only the active one may be submitted.
 * Every source resolves to a schema id the database already has: `SAVED` and
 * `UPLOAD` both end at a real `POST /extraction-schemas` row, so there is no
 * "local only" schema for a referral to be submitted against.
 */
export function useSchemaSelection(
  savedSchemas: readonly SavedSchema[],
): UseSchemaSelectionResult {
  const [source, setSource] = useState<SchemaSource>(SCHEMA_SOURCES.DEFAULT);
  const [savedSchemaId, setSavedSchemaId] = useState<string | undefined>(
    savedSchemas[0]?.id,
  );
  const [uploadedSchema, setUploadedSchema] = useState<UploadedSchema | undefined>();

  const selection = useMemo<SchemaSelection>(() => {
    if (source === SCHEMA_SOURCES.SAVED) return { source, savedSchemaId };
    if (source === SCHEMA_SOURCES.UPLOAD) {
      return {
        source,
        uploadedSchemaId: uploadedSchema?.id,
        schemaFileName: uploadedSchema?.fileName,
      };
    }
    return { source };
  }, [savedSchemaId, source, uploadedSchema]);

  const schemaLabel = useMemo(() => {
    if (source === SCHEMA_SOURCES.SAVED) {
      const match = savedSchemas.find((schema) => schema.id === savedSchemaId);
      return match?.name ?? "Saved schema";
    }
    if (source === SCHEMA_SOURCES.UPLOAD) {
      return uploadedSchema?.fileName ?? "Uploaded schema";
    }
    return "Default (LLM)";
  }, [savedSchemaId, savedSchemas, source, uploadedSchema]);

  const isComplete =
    source === SCHEMA_SOURCES.DEFAULT ||
    (source === SCHEMA_SOURCES.SAVED && Boolean(savedSchemaId)) ||
    // Requires the persisted id, not just a chosen file — a file that failed
    // validation or is still uploading must not be submittable.
    (source === SCHEMA_SOURCES.UPLOAD && Boolean(uploadedSchema?.id));

  const confirmSavedSchema = useCallback((id: string) => {
    setSavedSchemaId(id);
    setSource(SCHEMA_SOURCES.SAVED);
  }, []);

  return {
    source,
    savedSchemaId,
    uploadedSchema,
    selection,
    schemaLabel,
    isComplete,
    setSource: useCallback((next: SchemaSource) => setSource(next), []),
    setSavedSchemaId: useCallback((id: string) => setSavedSchemaId(id), []),
    setUploadedSchema: useCallback(
      (schema: UploadedSchema | undefined) => setUploadedSchema(schema),
      [],
    ),
    confirmSavedSchema,
  };
}
