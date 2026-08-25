"use client";

import { useServerAction } from "@/hooks/use-server-action";
import {
  createExtractionSchemaAction,
  type ExtractionSchemaDto,
  type SchemaFieldInput,
} from "@/server-actions/extraction-schemas";

export interface UseCreateExtractionSchemaOptions {
  onSuccess?: (schema: ExtractionSchemaDto) => void;
  onError?: (error: string) => void;
}

/** Domain wrapper around the `createExtractionSchemaAction` Server Action. */
export function useCreateExtractionSchema(
  options?: UseCreateExtractionSchemaOptions,
) {
  return useServerAction<SchemaFieldInput[], ExtractionSchemaDto>(
    createExtractionSchemaAction,
    options,
  );
}
