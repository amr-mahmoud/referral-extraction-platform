import { DOMAIN_ERROR } from '../../../libs/errors/domain-error-code.enum';
import { DomainException } from '../shared/domain.exception';

export class InvalidFieldDefinitionError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.SCHEMA_INVALID_FIELD_DEFINITION;

  constructor(message: string) {
    super(DOMAIN_ERROR.SCHEMA_INVALID_FIELD_DEFINITION, message);
  }
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
