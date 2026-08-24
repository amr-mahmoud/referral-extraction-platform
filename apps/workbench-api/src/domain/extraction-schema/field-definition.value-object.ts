import { DomainError } from '../shared/domain.error';

export class InvalidFieldDefinitionError extends DomainError {
  public readonly code = 'INVALID_FIELD_DEFINITION';

  constructor(message: string) {
    super(message);
  }
}

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  SELECT = 'select',
}

export class FieldDefinition {
  public constructor(
    public readonly key: string,
    public readonly label: string,
    public readonly type: FieldType,
    public readonly description: string | null,
  ) {
    if (typeof key !== 'string' || key.trim() === '') {
      throw new InvalidFieldDefinitionError(
        'Field key must be a non-empty string',
      );
    }
    if (typeof label !== 'string' || label.trim() === '') {
      throw new InvalidFieldDefinitionError(
        'Field label must be a non-empty string',
      );
    }
    if (!Object.values(FieldType).includes(type)) {
      throw new InvalidFieldDefinitionError(`Unknown field type '${type}'`);
    }
  }
}
