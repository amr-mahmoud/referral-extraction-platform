/**
 * Hand-written for now. Becomes `openapi-typescript` output once the WorkBench
 * API publishes its extraction-schema endpoints.
 */

export const SCHEMA_SOURCES = {
  /** Let the model infer the fields — no schema supplied. */
  DEFAULT: "default",
  /**
   * Reuse a schema the clinic has already saved — including one just
   * published from the field builder modal, whether built manually or
   * uploaded as JSON. Every schema selectable from the dashboard is a real
   * `POST /extraction-schemas` row; there is no "for this upload only" or
   * "one-off JSON" source distinct from this.
   */
  SAVED: "saved",
} as const;

export type SchemaSource = (typeof SCHEMA_SOURCES)[keyof typeof SCHEMA_SOURCES];

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
  /** Set when `source` is `SAVED`. */
  savedSchemaId?: string;
}
