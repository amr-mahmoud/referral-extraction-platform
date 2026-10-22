import { DOMAIN_ERROR } from '../../../libs/errors/domain-error-code.enum';
import { DomainException } from '../shared/domain.exception';
import { BoundingBox } from './bounding-box.value-object';

export class InvalidExtractedFieldError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.REFERRAL_INVALID_EXTRACTED_FIELD;

  constructor(message: string) {
    super(DOMAIN_ERROR.REFERRAL_INVALID_EXTRACTED_FIELD, message);
  }
}

export type ExtractedFieldSource = 'AI' | 'REVIEWER';

/** The key/label/value triple the AI originally produced for a field. */
export type ExtractedFieldAiOriginal = {
  key: string;
  label: string;
  value: string;
};

/** Lower snake_case, e.g. `patient_name`, `referral_date_2`. */
const EXTRACTED_FIELD_KEY_PATTERN = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;

export const assertValidExtractedFieldKeyFormat = (key: string): void => {
  if (typeof key !== 'string' || !EXTRACTED_FIELD_KEY_PATTERN.test(key)) {
    throw new InvalidExtractedFieldError(
      `Extracted field key '${String(key)}' must be lower snake_case`,
    );
  }
};

export class ExtractedField {
  public constructor(
    public readonly key: string,
    public readonly label: string,
    public readonly value: string,
    public readonly pageNumber: number | null,
    public readonly boundingBox: BoundingBox | null,
    public readonly source: ExtractedFieldSource = 'AI',
    public readonly aiOriginal: ExtractedFieldAiOriginal | null = null,
    public readonly correctedAt: Date | null = null,
  ) {
    if (typeof key !== 'string' || key.length === 0) {
      throw new InvalidExtractedFieldError(
        'Extracted field key must be a non-empty string',
      );
    }
    if (typeof label !== 'string' || label.trim().length === 0) {
      throw new InvalidExtractedFieldError(
        'Extracted field label must be a non-empty string',
      );
    }
    if (typeof value !== 'string') {
      throw new InvalidExtractedFieldError(
        'Extracted field value must be a string',
      );
    }
    if (source !== 'AI' && source !== 'REVIEWER') {
      throw new InvalidExtractedFieldError(
        `Extracted field source '${String(source)}' must be 'AI' or 'REVIEWER'`,
      );
    }
    const isReviewerFieldWithoutLocation =
      source === 'REVIEWER' && boundingBox === null && pageNumber === null;
    if (
      !isReviewerFieldWithoutLocation &&
      (!Number.isInteger(pageNumber) || (pageNumber as number) < 1)
    ) {
      throw new InvalidExtractedFieldError(
        'Extracted field pageNumber must be a positive integer',
      );
    }
    if (boundingBox !== null && !(boundingBox instanceof BoundingBox)) {
      throw new InvalidExtractedFieldError(
        'Extracted field boundingBox must be a BoundingBox or null',
      );
    }
    if (source === 'REVIEWER' && aiOriginal !== null) {
      throw new InvalidExtractedFieldError(
        'A reviewer-added field cannot have an AI original',
      );
    }
  }

  public get isEdited(): boolean {
    return this.aiOriginal !== null;
  }

  /**
   * Returns the field with new key/label/value. The first edit of an AI field
   * snapshots its AI original; later edits keep that snapshot. If the result
   * matches the snapshot the field returns to its unedited AI state.
   */
  public readonly withCorrection = (
    next: ExtractedFieldAiOriginal,
    correctedAt: Date,
  ): ExtractedField => {
    if (this.source === 'REVIEWER') {
      return new ExtractedField(
        next.key,
        next.label,
        next.value,
        this.pageNumber,
        this.boundingBox,
        'REVIEWER',
        null,
        correctedAt,
      );
    }
    const original: ExtractedFieldAiOriginal = this.aiOriginal ?? {
      key: this.key,
      label: this.label,
      value: this.value,
    };
    const isBackToAiOriginal =
      next.key === original.key &&
      next.label === original.label &&
      next.value === original.value;
    return new ExtractedField(
      next.key,
      next.label,
      next.value,
      this.pageNumber,
      this.boundingBox,
      'AI',
      isBackToAiOriginal ? null : original,
      isBackToAiOriginal ? null : correctedAt,
    );
  };

  /** Restores the AI original and clears provenance; only valid when edited. */
  public readonly revertedToAiOriginal = (): ExtractedField => {
    if (this.aiOriginal === null) {
      throw new InvalidExtractedFieldError(
        `Extracted field '${this.key}' has no AI original to revert to`,
      );
    }
    return new ExtractedField(
      this.aiOriginal.key,
      this.aiOriginal.label,
      this.aiOriginal.value,
      this.pageNumber,
      this.boundingBox,
      'AI',
      null,
      null,
    );
  };
}
