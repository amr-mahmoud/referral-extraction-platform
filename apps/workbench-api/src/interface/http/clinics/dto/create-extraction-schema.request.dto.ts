import { FieldType } from '../../../../domain/extraction-schema/field-definition.value-object';

export interface CreateExtractionSchemaRequest {
  fields: Array<{
    key: string;
    label: string;
    type: FieldType;
    description?: string | null;
  }>;
}
