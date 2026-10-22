import { DOMAIN_ERROR } from '../../../libs/errors/domain-error-code.enum';
import { DomainException } from '../shared/domain.exception';
import {
  assertValidExtractedFieldKeyFormat,
  ExtractedField,
} from './extracted-field.value-object';
import {
  DuplicateExtractedFieldKeyError,
  ExtractedFieldNotFoundError,
  ReferralCorrectionNotAllowedError,
  ReferralFileNameError,
  ReferralNotFoundError,
  ReferralSchemaAlreadyFixedError,
  ReferralValidationError,
} from './referral.errors';
import {
  InvalidReferralStatusTransitionError,
  ReferralStatus,
} from './referral-status.value-object';
import type { ReferralCreateProps } from './types';
import { ReferralStatusValue } from './types';

export class InvalidReferralIdError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.REFERRAL_INVALID_ID;

  constructor(id: unknown) {
    super(
      DOMAIN_ERROR.REFERRAL_INVALID_ID,
      `Invalid referral id: '${String(id)}'`,
    );
  }
}

/** Key the worker's extraction schema uses for the patient name. */
const PATIENT_NAME_FIELD_KEY = 'patient_name';

const PDF_FILE_NAME_PATTERN = /\.pdf$/i;

/**
 * A single referral upload, tracked from `PENDING` through to a
 * terminal `COMPLETED`/`FAILED` extraction result.
 */
export class Referral {
  public readonly id: string;
  public readonly clinicId: string;
  public readonly fileName: string;

  public readonly createdAt: Date;

  private _patientName: string | null;
  private _extractionSchemaId: string | null;
  private _status: ReferralStatus;
  private _extractedPayload: ExtractedField[];
  private _errorMessage: string | null;
  private _updatedAt: Date;

  public constructor({
    id,
    clinicId,
    fileName,
    patientName,
    extractionSchemaId,
    status,
    extractedPayload,
    errorMessage,
    createdAt,
    updatedAt,
  }: ReferralCreateProps) {
    if (!clinicId) {
      throw new ReferralValidationError('clinicId is required');
    }
    this.clinicId = clinicId;

    this.id =
      id !== undefined && id !== null ? this.validateId(id) : this.generateId();
    this.fileName = this.validateFileName(fileName);
    this._patientName = this.validatePatientName(patientName);

    this._extractionSchemaId = extractionSchemaId ?? null;
    this._status = status ?? ReferralStatus.from(ReferralStatusValue.PENDING);
    this._extractedPayload = extractedPayload ?? [];
    this._errorMessage = errorMessage ?? null;
    this.createdAt = createdAt ?? new Date();
    this._updatedAt = updatedAt ?? new Date();
  }

  private readonly validateFileName = (fileName: string): string => {
    if (typeof fileName !== 'string' || fileName.trim() === '') {
      throw new ReferralFileNameError('File name must be a non-empty string');
    }
    if (!PDF_FILE_NAME_PATTERN.test(fileName.trim())) {
      throw new ReferralFileNameError(
        `File name '${fileName}' must end in '.pdf'`,
      );
    }
    return fileName.trim();
  };

  private readonly validatePatientName = (
    patientName: string | null | undefined,
  ): string | null => {
    if (patientName === undefined || patientName === null) {
      return null;
    }
    if (typeof patientName !== 'string' || patientName.trim() === '') {
      throw new ReferralValidationError(
        'Patient name must be a non-empty string when provided',
      );
    }
    return patientName;
  };

  public get referralId(): string {
    return this.id;
  }

  public get status(): ReferralStatus {
    return this._status;
  }

  public get patientName(): string | null {
    return this._patientName;
  }

  /** COMPLETED/REJECTED are final; FAILED is retryable and deliberately excluded. */
  public get isInTerminalState(): boolean {
    return (
      this._status.value === ReferralStatusValue.COMPLETED ||
      this._status.value === ReferralStatusValue.REJECTED
    );
  }

  public get extractionSchemaId(): string | null {
    return this._extractionSchemaId;
  }

  public get extractedPayload(): ExtractedField[] {
    return this._extractedPayload;
  }

  public get errorMessage(): string | null {
    return this._errorMessage;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public readonly resolveSchema = (extractionSchemaId: string): void => {
    if (this._status.value !== ReferralStatusValue.PENDING) {
      throw new ReferralSchemaAlreadyFixedError(this.id);
    }
    if (
      this._extractionSchemaId !== null &&
      this._extractionSchemaId !== extractionSchemaId
    ) {
      throw new ReferralSchemaAlreadyFixedError(this.id);
    }
    this._extractionSchemaId = extractionSchemaId;
    this._touch();
  };

  public readonly generateId = (): string => crypto.randomUUID();

  public readonly validateId = (id: string): string => {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new InvalidReferralIdError(id);
    }
    return id.trim();
  };

  public readonly startProcessing = (): void => {
    this._transitionTo(ReferralStatusValue.PROCESSING);
  };

  public readonly complete = (extractedPayload: ExtractedField[]): void => {
    this._transitionTo(ReferralStatusValue.COMPLETED);
    this._extractedPayload = extractedPayload;
    this._errorMessage = null;
  };

  public readonly fail = (errorMessage: string): void => {
    this._transitionTo(ReferralStatusValue.FAILED);
    this._errorMessage = errorMessage;
  };

  /**
   * Worker-result mutation (design: the worker publishes results via the
   * status-update queue; the workbench owns every DB write). Validates the
   * target is a terminal worker status and the transition is legal from the
   * current state, then applies the payload/patientName (COMPLETED) or error
   * (REJECTED/FAILED). COMPLETED/REJECTED rows reject any further update —
   * the use case treats a redelivered event as a no-op by checking
   * `isInTerminalState` before calling.
   */
  public readonly updateStatus = (
    status: ReferralStatusValue,
    extractedPayload: ExtractedField[],
    patientName: string | null,
    errorMessage: string | null,
  ): void => {
    if (
      status !== ReferralStatusValue.COMPLETED &&
      status !== ReferralStatusValue.REJECTED &&
      status !== ReferralStatusValue.FAILED
    ) {
      throw new ReferralValidationError(
        `'${String(status)}' is not a terminal worker status`,
      );
    }
    if (this.isInTerminalState) {
      throw new InvalidReferralStatusTransitionError(
        this._status.value,
        status,
      );
    }

    this._transitionTo(status);

    if (status === ReferralStatusValue.COMPLETED) {
      this._extractedPayload = extractedPayload;
      this._patientName = this.validatePatientName(patientName);
      this._errorMessage = null;
    } else {
      // REJECTED / FAILED — persist the rejection or failure reason.
      this._errorMessage = errorMessage;
    }
  };

  /** Tenant guard — a referral may only be mutated by its owning clinic. */
  public readonly assertBelongsToClinic = (clinicId: string): void => {
    if (this.clinicId !== clinicId) {
      // Don't leak whether a foreign referral exists.
      throw new ReferralNotFoundError(this.id);
    }
  };

  /** Edits an existing field's key/label/value; bbox and page stay attached. */
  public readonly correctField = (
    fieldKey: string,
    correction: { key?: string; label?: string; value: string },
  ): void => {
    this.assertCorrectionAllowed();
    const fieldIndex = this.findFieldIndexOrThrow(fieldKey);
    const currentField = this._extractedPayload[fieldIndex];

    const nextKey = correction.key ?? currentField.key;
    if (nextKey !== currentField.key) {
      assertValidExtractedFieldKeyFormat(nextKey);
      this.assertKeyIsUnused(nextKey);
    }

    const correctedField = currentField.withCorrection(
      {
        key: nextKey,
        label: correction.label ?? currentField.label,
        value: correction.value,
      },
      new Date(),
    );
    this.replaceFieldAt(fieldIndex, correctedField);
  };

  /** Appends a reviewer-authored field (no PDF location). */
  public readonly addReviewerField = (field: {
    key: string;
    label: string;
    value: string;
  }): void => {
    this.assertCorrectionAllowed();
    assertValidExtractedFieldKeyFormat(field.key);
    this.assertKeyIsUnused(field.key);

    const reviewerField = new ExtractedField(
      field.key,
      field.label,
      field.value,
      null,
      null,
      'REVIEWER',
      null,
      new Date(),
    );
    this._extractedPayload = [...this._extractedPayload, reviewerField];
    this.syncPatientName(null, reviewerField);
    this._touch();
  };

  /** Restores an edited AI field to what the AI originally extracted. */
  public readonly revertFieldToAiOriginal = (fieldKey: string): void => {
    this.assertCorrectionAllowed();
    const fieldIndex = this.findFieldIndexOrThrow(fieldKey);
    const currentField = this._extractedPayload[fieldIndex];
    if (!currentField.isEdited) {
      throw new ReferralCorrectionNotAllowedError(this.id);
    }

    const revertedField = currentField.revertedToAiOriginal();
    if (revertedField.key !== currentField.key) {
      this.assertKeyIsUnused(revertedField.key);
    }
    this.replaceFieldAt(fieldIndex, revertedField);
  };

  private readonly assertCorrectionAllowed = (): void => {
    const isCorrectable =
      this._status.value === ReferralStatusValue.COMPLETED &&
      this._extractedPayload.length > 0;
    if (!isCorrectable) {
      throw new ReferralCorrectionNotAllowedError(this.id);
    }
  };

  private readonly findFieldIndexOrThrow = (fieldKey: string): number => {
    const fieldIndex = this._extractedPayload.findIndex(
      (field) => field.key === fieldKey,
    );
    if (fieldIndex === -1) {
      throw new ExtractedFieldNotFoundError(this.id, fieldKey);
    }
    return fieldIndex;
  };

  private readonly assertKeyIsUnused = (key: string): void => {
    if (this._extractedPayload.some((field) => field.key === key)) {
      throw new DuplicateExtractedFieldKeyError(this.id, key);
    }
  };

  private readonly replaceFieldAt = (
    fieldIndex: number,
    field: ExtractedField,
  ): void => {
    const previousField = this._extractedPayload[fieldIndex];
    this._extractedPayload = this._extractedPayload.map((existing, index) =>
      index === fieldIndex ? field : existing,
    );
    this.syncPatientName(previousField, field);
    this._touch();
  };

  /** Keeps the dashboard's patient name in step with the patient-name field. */
  private readonly syncPatientName = (
    previousField: ExtractedField | null,
    field: ExtractedField,
  ): void => {
    if (field.key === PATIENT_NAME_FIELD_KEY) {
      const trimmedValue = field.value.trim();
      this._patientName = trimmedValue === '' ? null : trimmedValue;
      return;
    }
    if (previousField?.key === PATIENT_NAME_FIELD_KEY) {
      this._patientName = null;
    }
  };

  private readonly _transitionTo = (next: ReferralStatusValue): void => {
    const nextStatus = ReferralStatus.from(next);
    this._status.assertCanTransitionTo(nextStatus);
    this._status = nextStatus;
    this._touch();
  };

  private readonly _touch = (): void => {
    this._updatedAt = new Date();
  };
}
