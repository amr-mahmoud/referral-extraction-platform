import { DomainError } from '../shared/domain.error';
import { BoundingBox } from './bounding-box.value-object';

export class InvalidExtractedFieldError extends DomainError {
  public readonly code = 'INVALID_EXTRACTED_FIELD';

  constructor(message: string) {
    super(message);
  }
}

export class ExtractedField {
  public constructor(
    public readonly value: string,
    public readonly pageNumber: number,
    public readonly boundingBox: BoundingBox | null,
  ) {
    if (typeof value !== 'string') {
      throw new InvalidExtractedFieldError(
        'Extracted field value must be a string',
      );
    }
    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      throw new InvalidExtractedFieldError(
        'Extracted field pageNumber must be a positive integer',
      );
    }
    if (boundingBox !== null && !(boundingBox instanceof BoundingBox)) {
      throw new InvalidExtractedFieldError(
        'Extracted field boundingBox must be a BoundingBox or null',
      );
    }
  }
}
