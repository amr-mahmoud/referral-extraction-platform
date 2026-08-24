import { ClinicId } from '../shared/ids/clinic-id.value-object';
import { ExtractionSchemaId } from '../shared/ids/extraction-schema-id.value-object';
import { ClinicValidationError } from './clinic.errors';
import { PasswordHash } from './password-hash.value-object';

export interface ClinicCreateProps {
  id: ClinicId;
  clinicName: string;
  username: string;
  passwordHash: PasswordHash;
  defaultExtractionSchemaId?: ExtractionSchemaId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Clinic {
  private _passwordHash: PasswordHash;
  private _defaultExtractionSchemaId: ExtractionSchemaId | null;
  private _updatedAt: Date;

  public constructor(
    public readonly id: ClinicId,
    public readonly clinicName: string,
    public readonly username: string,
    passwordHash: PasswordHash,
    defaultExtractionSchemaId: ExtractionSchemaId | null,
    public readonly createdAt: Date,
    updatedAt: Date,
  ) {
    if (typeof clinicName !== 'string' || clinicName.trim() === '') {
      throw new ClinicValidationError('Clinic name must be a non-empty string');
    }
    if (typeof username !== 'string' || username.trim() === '') {
      throw new ClinicValidationError(
        'Clinic username must be a non-empty string',
      );
    }
    if (!(passwordHash instanceof PasswordHash)) {
      throw new ClinicValidationError(
        'Password hash must be a valid PasswordHash',
      );
    }
    if (
      defaultExtractionSchemaId !== null &&
      !(defaultExtractionSchemaId instanceof ExtractionSchemaId)
    ) {
      throw new ClinicValidationError(
        'Default extraction schema must be an ExtractionSchemaId or null',
      );
    }
    this._passwordHash = passwordHash;
    this._defaultExtractionSchemaId = defaultExtractionSchemaId;
    this._updatedAt = updatedAt;
  }

  public static create(props: ClinicCreateProps): Clinic {
    return new Clinic(
      props.id,
      props.clinicName,
      props.username,
      props.passwordHash,
      props.defaultExtractionSchemaId ?? null,
      props.createdAt ?? new Date(),
      props.updatedAt ?? new Date(),
    );
  }

  public get passwordHash(): PasswordHash {
    return this._passwordHash;
  }

  public get defaultExtractionSchemaId(): ExtractionSchemaId | null {
    return this._defaultExtractionSchemaId;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  public changeDefaultSchema(
    extractionSchemaId: ExtractionSchemaId | null,
  ): void {
    if (
      extractionSchemaId !== null &&
      !(extractionSchemaId instanceof ExtractionSchemaId)
    ) {
      throw new ClinicValidationError(
        'Default extraction schema must be an ExtractionSchemaId or null',
      );
    }
    this._defaultExtractionSchemaId = extractionSchemaId;
    this._updatedAt = new Date();
  }

  public changePassword(passwordHash: PasswordHash): void {
    if (!(passwordHash instanceof PasswordHash)) {
      throw new ClinicValidationError(
        'Password hash must be a valid PasswordHash',
      );
    }
    this._passwordHash = passwordHash;
    this._updatedAt = new Date();
  }
}
