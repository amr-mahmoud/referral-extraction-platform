import { DomainError } from '../shared/domain.error';

export enum ExtractionSchemaErrorCode {
  INVALID_SCHEMA = 'INVALID_SCHEMA',
  EMPTY_SCHEMA = 'EMPTY_SCHEMA',
  SCHEMA_NOT_FOUND = 'SCHEMA_NOT_FOUND',
}

export class ExtractionSchemaValidationError extends DomainError {
  public readonly code = ExtractionSchemaErrorCode.INVALID_SCHEMA;

  constructor(message: string) {
    super(message);
  }
}

export class ExtractionSchemaNotFoundError extends DomainError {
  public readonly code = ExtractionSchemaErrorCode.SCHEMA_NOT_FOUND;

  constructor(schemaId: string) {
    super(`Extraction schema with id '${schemaId}' was not found`);
  }
}
