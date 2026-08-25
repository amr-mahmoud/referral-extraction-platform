import { DomainError } from '../shared/domain.error';
import { ClinicId } from '../shared/ids/clinic-id.value-object';
import { ExtractionSchemaId } from '../shared/ids/extraction-schema-id.value-object';
import { ExtractedField } from './extracted-field.value-object';
import {
  ReferralCorrectionNotAllowedError,
  ReferralFileNameError,
  ReferralSchemaAlreadyFixedError,
  ReferralValidationError,
} from './referral.errors';
import {
  ReferralStatus,
  ReferralStatusValue,
} from './referral-status.value-object';

export class InvalidReferralIdError extends DomainError {
  public readonly code = 'INVALID_REFERRAL_ID';

  constructor(id: unknown) {
    super(`Invalid referral id: '${String(id)}'`);
  }
}

const PDF_FILE_NAME_PATTERN = /\.pdf$/i;

export interface ReferralCreateProps {
  /** Self-generated when absent. Expected to be a string. */
  id?: string;
  clinicId: ClinicId;
  /** Original uploaded file name; must end in `.pdf`. */
  fileName: string;
  /** Unknown until extraction resolves one — `null` is a legal, expected state. */
  patientName?: string | null;

  extractionSchemaId?: ExtractionSchemaId | null;
  status?: ReferralStatus;
  extractedPayload?: ExtractedField[];
  errorMessage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * A single referral upload, tracked from `AWAITING_UPLOAD` through to a
 * terminal `COMPLETED`/`FAILED` extraction result.
 */
export class Referral {
  public readonly id: string;
  public readonly clinicId: ClinicId;
  public readonly fileName: string;
  public readonly patientName: string | null;

  public readonly createdAt: Date;

  private _extractionSchemaId: ExtractionSchemaId | null;
  private _status: ReferralStatus;
  private _extractedPayload: ExtractedField[];
  private _errorMessage: string | null;
  private _updatedAt: Date;

  public static readonly generateId = (): string => crypto.randomUUID();

  public static readonly validateId = (id: string): string => {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new InvalidReferralIdError(id);
    }
    return id.trim();
  };

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
      id !== undefined && id !== null
        ? Referral.validateId(id)
        : Referral.generateId();
    this.fileName = this.validateFileName(fileName);
    this.patientName = this.validatePatientName(patientName);

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

  public get extractionSchemaId(): ExtractionSchemaId | null {
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

  public readonly resolveSchema = (
    extractionSchemaId: ExtractionSchemaId,
  ): void => {
    if (
      this._status.value !== ReferralStatusValue.AWAITING_UPLOAD &&
      this._status.value !== ReferralStatusValue.PENDING
    ) {
      throw new ReferralSchemaAlreadyFixedError(this.id);
    }
    if (
      this._extractionSchemaId !== null &&
      !this._extractionSchemaId.equals(extractionSchemaId)
    ) {
      throw new ReferralSchemaAlreadyFixedError(this.id);
    }
    this._extractionSchemaId = extractionSchemaId;
    this._touch();
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
