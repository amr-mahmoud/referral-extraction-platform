import type { FieldDefinitionInput } from '../domain-types/extraction-schema.input';

/**
 * Input contract for constructing an `ExtractionSchema` aggregate.
 * Kept separate from the aggregate so the class file holds only behaviour.
 */
export interface ExtractionSchemaCreateProps {
  id?: string;
  /** Owning clinic id (UUID string). */
  clinicId: string;
  /**
   * Human-friendly version name shown in the dashboard ("Q3 Insurance Forms").
   * Falls back to `Custom schema v{version}` when omitted, so every schema
   * carries a displayable string no matter which entry point created it.
   */
  title?: string;
  /** Explicit version. Mutually exclusive with `oldVersion`. */
  version?: number;
  /** Raw field inputs — the aggregate builds the `FieldDefinition` VOs itself. */
  schemaDefinition: FieldDefinitionInput[];
  createdAt?: Date;
  /** Version being superseded; the new schema lands at `oldVersion + 1`. */
  oldVersion?: number;
}

/** The value type of a schema field. */
export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  SELECT = 'select',
}
