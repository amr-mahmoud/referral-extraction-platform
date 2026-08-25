/**
 * Hand-written for now. Becomes `openapi-typescript` output once the WorkBench
 * API publishes its extraction-schema endpoints.
 */

export const SCHEMA_SOURCES = {
  /** Let the model infer the fields — no schema supplied. */
  DEFAULT: "default",
  /** Reuse a schema the clinic has already saved. */
  SAVED: "saved",
  /** Upload a one-off schema JSON alongside the documents — persisted on validation. */
  UPLOAD: "upload",
} as const;

export type SchemaSource = (typeof SCHEMA_SOURCES)[keyof typeof SCHEMA_SOURCES];

/**
 * Every schema referenceable from the dashboard is one the clinic already has
 * saved in the database — there is no "for this upload only" schema. The
 * field builder publishes to `POST /extraction-schemas` the moment its fields
 * are confirmed and the result becomes a `SavedSchema`, same as any other.
 */
export interface SavedSchema {
  id: string;
  name: string;
  fieldCount: number;
}

/** A field as the in-app field builder collects it, before it's published. */
export interface CustomSchemaField {
  name: string;
  description: string;
}

/** The schema half of an upload request, as chosen in the dashboard panel. */
export interface SchemaSelection {
  source: SchemaSource;
  /** Set when `source` is `SAVED` (including one just published from the field builder). */
  savedSchemaId?: string;
  /** Set when `source` is `UPLOAD`, once the dropped file is persisted. */
  uploadedSchemaId?: string;
  /** Set when `source` is `UPLOAD` — display only, the id above is authoritative. */
  schemaFileName?: string;
}
