import { DOMAIN_ERROR } from '../../../libs/errors/domain-error-code.enum';
import { DomainException } from '../shared/domain.exception';
import { BoundingBox } from './bounding-box.value-object';

export class InvalidExtractedFieldError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.REFERRAL_INVALID_EXTRACTED_FIELD;

  constructor(message: string) {
    super(DOMAIN_ERROR.REFERRAL_INVALID_EXTRACTED_FIELD, message);
  }
}

export class ExtractedField {
  public constructor(
    public readonly key: string,
    public readonly label: string,
    public readonly value: string,
    public readonly pageNumber: number,
    public readonly boundingBox: BoundingBox | null,
  ) {
    if (typeof key !== 'string' || key.length === 0) {
      throw new InvalidExtractedFieldError(
        'Extracted field key must be a non-empty string',
      );
    }
    if (typeof label !== 'string' || label.length === 0) {
      throw new InvalidExtractedFieldError(
        'Extracted field label must be a non-empty string',
      );
    }
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
