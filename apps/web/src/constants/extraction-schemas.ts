import { SCHEMA_SOURCES, type SchemaSource } from "@/types/extraction-schemas/schema";

export const SCHEMA_SOURCE_LABELS: Record<SchemaSource, string> = {
  [SCHEMA_SOURCES.DEFAULT]: "Default — LLM auto-extract",
  [SCHEMA_SOURCES.SAVED]: "Saved schema",
  [SCHEMA_SOURCES.UPLOAD]: "Upload schema JSON",
  [SCHEMA_SOURCES.BUILT]: "Custom fields",
};

export const SCHEMA_SOURCE_DESCRIPTIONS: Partial<Record<SchemaSource, string>> = {
  [SCHEMA_SOURCES.DEFAULT]:
    "Patient, address, insurance, referring provider",
};

/** Order the sources appear in the schema panel. */
export const SCHEMA_SOURCE_ORDER: readonly SchemaSource[] = [
  SCHEMA_SOURCES.DEFAULT,
  SCHEMA_SOURCES.SAVED,
  SCHEMA_SOURCES.UPLOAD,
];

export const SCHEMA_UPLOAD_ACCEPTED_EXTENSION = ".json";
