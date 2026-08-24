/**
 * Hand-written for now. Becomes `openapi-typescript` output once the WorkBench
 * API publishes its extraction-schema endpoints.
 */

export const SCHEMA_SOURCES = {
  /** Let the model infer the fields — no schema supplied. */
  DEFAULT: "default",
  /** Reuse a schema the clinic has already saved. */
  SAVED: "saved",
  /** Upload a one-off schema JSON alongside the documents. */
  UPLOAD: "upload",
} as const;

export type SchemaSource = (typeof SCHEMA_SOURCES)[keyof typeof SCHEMA_SOURCES];

export interface SavedSchema {
  id: string;
  name: string;
  fieldCount: number;
}

/** The schema half of an upload request, as chosen in the dashboard panel. */
export interface SchemaSelection {
  source: SchemaSource;
  /** Set when `source` is `SAVED`. */
  savedSchemaId?: string;
  /** Set when `source` is `UPLOAD`. */
  schemaFileName?: string;
}
