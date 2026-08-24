import { ClinicId } from '../shared/ids/clinic-id.value-object';
import { ExtractionSchemaId } from '../shared/ids/extraction-schema-id.value-object';
import { ReferralId } from '../shared/ids/referral-id.value-object';
import { ExtractedField } from './extracted-field.value-object';
import {
  ReferralCorrectionNotAllowedError,
  ReferralSchemaAlreadyFixedError,
  ReferralValidationError,
} from './referral.errors';
import {
  ReferralStatus,
  ReferralStatusValue,
} from './referral-status.value-object';
import { S3Object } from './s3-object.value-object';

export interface ReferralCreateProps {
  id: ReferralId;
  clinicId: ClinicId;
  patientName: string;
  s3Object: S3Object;
  extractionSchemaId?: ExtractionSchemaId | null;
  status?: ReferralStatus;
  extractedPayload?: ExtractedField[];
  errorMessage?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Referral {
  private _status: ReferralStatus;
  private _extractionSchemaId: ExtractionSchemaId | null;
  private _extractedPayload: ExtractedField[];
  private _errorMessage: string | null;
  private _updatedAt: Date;

  public constructor(
    public readonly id: ReferralId,
    public readonly clinicId: ClinicId,
    public readonly patientName: string,
    public readonly s3Object: S3Object,
    extractionSchemaId: ExtractionSchemaId | null,
    status: ReferralStatus,
    extractedPayload: ExtractedField[],
    errorMessage: string | null,
    public readonly createdAt: Date,
    updatedAt: Date,
  ) {
    if (typeof patientName !== 'string' || patientName.trim() === '') {
      throw new ReferralValidationError(
        'Patient name must be a non-empty string',
      );
    }
    this._extractionSchemaId = extractionSchemaId;
    this._status = status;
    this._extractedPayload = extractedPayload;
    this._errorMessage = errorMessage;
    this._updatedAt = updatedAt;
  }

  public static create(props: ReferralCreateProps): Referral {
    return new Referral(
      props.id,
      props.clinicId,
      props.patientName,
      props.s3Object,
      props.extractionSchemaId ?? null,
      props.status ?? ReferralStatus.from(ReferralStatusValue.AWAITING_UPLOAD),
      props.extractedPayload ?? [],
      props.errorMessage ?? null,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
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

  public resolveSchema(extractionSchemaId: ExtractionSchemaId): void {
    if (
      this._status.value !== ReferralStatusValue.AWAITING_UPLOAD &&
      this._status.value !== ReferralStatusValue.PENDING
    ) {
      throw new ReferralSchemaAlreadyFixedError(this.id.value);
    }
    if (
      this._extractionSchemaId !== null &&
      !this._extractionSchemaId.equals(extractionSchemaId)
    ) {
      throw new ReferralSchemaAlreadyFixedError(this.id.value);
    }
    this._extractionSchemaId = extractionSchemaId;
    this._touch();
  }

  public markUploaded(): void {
    this._transitionTo(ReferralStatusValue.PENDING);
  }

  public startProcessing(): void {
    this._transitionTo(ReferralStatusValue.PROCESSING);
  }

  public complete(extractedPayload: ExtractedField[]): void {
    this._transitionTo(ReferralStatusValue.COMPLETED);
    this._extractedPayload = extractedPayload;
    this._errorMessage = null;
  }

  public fail(errorMessage: string): void {
    this._transitionTo(ReferralStatusValue.FAILED);
    this._errorMessage = errorMessage;
  }

  public applyCorrection(extractedPayload: ExtractedField[]): void {
    if (this._status.value !== ReferralStatusValue.COMPLETED) {
      throw new ReferralCorrectionNotAllowedError(this.id.value);
    }
    this._extractedPayload = extractedPayload;
    this._touch();
  }

  private _transitionTo(next: ReferralStatusValue): void {
    const nextStatus = ReferralStatus.from(next);
    this._status.assertCanTransitionTo(nextStatus);
    this._status = nextStatus;
    this._touch();
  }

  private _touch(): void {
    this._updatedAt = new Date();
  }
}
