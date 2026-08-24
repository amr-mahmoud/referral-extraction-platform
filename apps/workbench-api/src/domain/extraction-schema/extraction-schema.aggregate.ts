import { ClinicId } from '../shared/ids/clinic-id.value-object';
import { ExtractionSchemaId } from '../shared/ids/extraction-schema-id.value-object';
import { ExtractionSchemaValidationError } from './extraction-schema.errors';
import { FieldDefinition } from './field-definition.value-object';

export interface ExtractionSchemaCreateProps {
  id: ExtractionSchemaId;
  clinicId: ClinicId;
  version?: number;
  schemaDefinition: FieldDefinition[];
  createdAt?: Date;
}

export class ExtractionSchema {
  public constructor(
    public readonly id: ExtractionSchemaId,
    public readonly clinicId: ClinicId,
    public readonly version: number,
    public readonly schemaDefinition: readonly FieldDefinition[],
    public readonly createdAt: Date,
  ) {
    if (!Number.isInteger(version) || version < 1) {
      throw new ExtractionSchemaValidationError(
        'Schema version must be a positive integer',
      );
    }
    if (!Array.isArray(schemaDefinition) || schemaDefinition.length === 0) {
      throw new ExtractionSchemaValidationError(
        'Schema definition must contain at least one field',
      );
    }
  }

  public static create(props: ExtractionSchemaCreateProps): ExtractionSchema {
    return new ExtractionSchema(
      props.id,
      props.clinicId,
      props.version ?? 1,
      props.schemaDefinition,
      props.createdAt ?? new Date(),
    );
  }

  public createNextVersion(
    schemaDefinition: FieldDefinition[],
  ): ExtractionSchema {
    return new ExtractionSchema(
      this.id,
      this.clinicId,
      this.version + 1,
      schemaDefinition,
      new Date(),
    );
  }
}
