/**
 * The one shape the domain accepts for a schema field.
 *
 * Wire formats (an array of field objects, or a flat `name -> description`
 * map) are normalised into this by the interface layer — see
 * `interface/http/dto/extraction-schema-input.mapper.ts`. The domain
 * deliberately knows nothing about those variants.
 */
export interface FieldDefinitionInput {
  /** Parameter name; slugified into the stored JSON property key. */
  key?: string;
  /** Human-readable label. Falls back to `key`. */
  label?: string;
  /** Mandatory extraction guidance for the LLM. */
  description: string;
}
