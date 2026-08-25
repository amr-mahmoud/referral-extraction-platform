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
    public readonly description: string,
  ) {
    if (typeof key !== 'string' || key.trim() === '') {
      throw new InvalidFieldDefinitionError(
        'Field key/name must be a non-empty string',
      );
    }
    if (typeof label !== 'string' || label.trim() === '') {
      throw new InvalidFieldDefinitionError(
        'Field label/name must be a non-empty string',
      );
    }
    if (typeof description !== 'string' || description.trim() === '') {
      throw new InvalidFieldDefinitionError(
        'Field description is required and must be a non-empty string',
      );
    }
  }
}
