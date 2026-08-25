"use client";

import { useCallback, useState } from "react";

import { validateExtractionSchemaJson } from "@/managers/extraction-schema-input.manager";
import type { ExtractionSchemaDto } from "@/server-actions/extraction-schemas";
import { useCreateExtractionSchema } from "@/server-hooks/extraction-schemas/use-create-extraction-schema";

export interface UseUploadSchemaJsonOptions {
  onSuccess?: (schema: ExtractionSchemaDto) => void;
}

export interface UseUploadSchemaJsonResult {
  isLoading: boolean;
  error: string | null;
  /** Reads, structurally validates, then persists the dropped/selected file. */
  upload: (file: File) => void;
  reset: () => void;
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

/**
 * Owns the "Upload schema JSON" pipeline end to end: read the file, parse it,
 * run it through the same structural check the API applies
 * (`validateExtractionSchemaJson` mirrors `normalizeExtractionSchemaFields`),
 * and only then spend a network round trip. A malformed file fails instantly;
 * a structurally valid one still goes through `createExtractionSchemaAction`,
 * whose domain-level errors (no fields, duplicate keys) surface via `error`
 * same as a local one.
 */
export function useUploadSchemaJson(
  options: UseUploadSchemaJsonOptions = {},
): UseUploadSchemaJsonResult {
  const [localError, setLocalError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  const create = useCreateExtractionSchema({ onSuccess: options.onSuccess });

  const upload = useCallback(
    (file: File) => {
      setLocalError(null);
      create.reset();
      setIsReading(true);

      readFileAsText(file)
        .then((text) => {
          let parsed: unknown;
          try {
            parsed = JSON.parse(text);
          } catch {
            setLocalError(`'${file.name}' is not valid JSON.`);
            return;
          }

          const result = validateExtractionSchemaJson(parsed);
          if (!result.valid) {
            setLocalError(result.error);
            return;
          }

          create.execute(
            result.fields.map((field) => ({
              name: field.name,
              description: field.description,
            })),
          );
        })
        .catch(() => setLocalError(`Could not read '${file.name}'.`))
        .finally(() => setIsReading(false));
    },
    [create],
  );

  const reset = useCallback(() => {
    setLocalError(null);
    create.reset();
  }, [create]);

  return {
    isLoading: isReading || create.isLoading,
    error: localError ?? create.error,
    upload,
    reset,
  };
}
