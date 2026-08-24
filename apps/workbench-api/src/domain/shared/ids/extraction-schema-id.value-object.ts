import { DomainError } from '../domain.error';

export class InvalidExtractionSchemaIdError extends DomainError {
  public readonly code = 'INVALID_EXTRACTION_SCHEMA_ID';

  constructor(id: unknown) {
    super(`Invalid extraction schema id: '${String(id)}'`);
  }
}

export class ExtractionSchemaId {
  private constructor(public readonly value: string) {}

  public static from(value: string): ExtractionSchemaId {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new InvalidExtractionSchemaIdError(value);
    }
    return new ExtractionSchemaId(value);
  }

  public equals(other: ExtractionSchemaId): boolean {
    return this.value === other.value;
  }
}
