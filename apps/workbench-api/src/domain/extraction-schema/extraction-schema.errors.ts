import { DOMAIN_ERROR } from '../../../libs/errors/domain-error-code.enum';
import { DomainException } from '../shared/domain.exception';

export class ExtractionSchemaValidationError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.SCHEMA_INVALID;

  constructor(message: string) {
    super(DOMAIN_ERROR.SCHEMA_INVALID, message);
  }
}

export class ExtractionSchemaEmptyError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.SCHEMA_EMPTY;

  constructor(message: string) {
    super(DOMAIN_ERROR.SCHEMA_EMPTY, message);
  }
}

export class ExtractionSchemaNotFoundError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.SCHEMA_NOT_FOUND;

  constructor(schemaId: string) {
    super(
      DOMAIN_ERROR.SCHEMA_NOT_FOUND,
      `Extraction schema with id '${schemaId}' was not found`,
    );
  }
}
