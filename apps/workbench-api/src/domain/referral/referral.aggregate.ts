import { DOMAIN_ERROR } from '../../../libs/errors/domain-error-code.enum';
import { DomainException } from '../shared/domain.exception';
import { ExtractedField } from './extracted-field.value-object';
import {
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

const PDF_FILE_NAME_PATTERN = /\.pdf$/i;

/**
 * A single referral upload, tracked from `AWAITING_UPLOAD` through to a
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
    this._status =
      status ?? ReferralStatus.from(ReferralStatusValue.AWAITING_UPLOAD);
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
    if (
      this._status.value !== ReferralStatusValue.AWAITING_UPLOAD &&
      this._status.value !== ReferralStatusValue.PENDING
    ) {
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

  public readonly markUploaded = (): void => {
    this._transitionTo(ReferralStatusValue.PENDING);
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

  public readonly applyCorrection = (
    extractedPayload: ExtractedField[],
  ): void => {
    if (this._status.value !== ReferralStatusValue.COMPLETED) {
      throw new ReferralCorrectionNotAllowedError(this.id);
    }
    this._extractedPayload = extractedPayload;
    this._touch();
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
