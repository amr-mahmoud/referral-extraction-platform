import { ClinicId } from '../shared/ids/clinic-id.value-object';
import { ExtractionSchemaId } from '../shared/ids/extraction-schema-id.value-object';
import {
  ClinicInvalidCredentialsError,
  ClinicInvalidUsernameFormatError,
  ClinicValidationError,
  ClinicWeakPasswordError,
} from './clinic.errors';
import { PasswordHash } from './password-hash.value-object';
import type { PasswordVerifier } from './password-verifier.type';

const MIN_PASSWORD_LENGTH = 8;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,50}$/;

export interface ClinicCreateProps {
  id?: ClinicId | string;
  clinicName: string;
  username: string;
  passwordHash?: PasswordHash | string;
  rawPassword?: string;
  hashedPassword?: string;
  defaultExtractionSchemaId?: ExtractionSchemaId | string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Clinic {
  id: ClinicId;
  clinicName: string;
  username: string;
  private _passwordHash: PasswordHash;
  private _defaultExtractionSchemaId: ExtractionSchemaId | null;
  createdAt: Date;
  private _updatedAt: Date;

  public constructor(props: ClinicCreateProps) {
    if (!props) {
      throw new ClinicValidationError('Clinic properties are required');
    }

    if (
      typeof props.clinicName !== 'string' ||
      props.clinicName.trim() === ''
    ) {
      throw new ClinicValidationError('Clinic name must be a non-empty string');
    }

    if (typeof props.username !== 'string' || props.username.trim() === '') {
      throw new ClinicValidationError(
        'Clinic username must be a non-empty string',
      );
    }

    if (!USERNAME_PATTERN.test(props.username)) {
      throw new ClinicInvalidUsernameFormatError();
    }

    if (props.rawPassword !== undefined && props.rawPassword !== null) {
      if (props.rawPassword.length < MIN_PASSWORD_LENGTH) {
        throw new ClinicWeakPasswordError(MIN_PASSWORD_LENGTH);
      }
    }

    let passwordHash: PasswordHash;
    if (props.passwordHash) {
      passwordHash =
        typeof props.passwordHash === 'string'
          ? PasswordHash.from(props.passwordHash)
          : props.passwordHash;
    } else if (props.hashedPassword) {
      passwordHash = PasswordHash.from(props.hashedPassword);
    } else {
      throw new ClinicValidationError(
        'Password hash must be a valid PasswordHash',
      );
    }

    if (!(passwordHash instanceof PasswordHash)) {
      throw new ClinicValidationError(
        'Password hash must be a valid PasswordHash',
      );
    }

    this.id = props.id
      ? typeof props.id === 'string'
        ? ClinicId.from(props.id)
        : props.id
      : ClinicId.from(crypto.randomUUID());

    this.clinicName = props.clinicName.trim();
    this.username = props.username;
    this._passwordHash = passwordHash;

    if (
      props.defaultExtractionSchemaId !== undefined &&
      props.defaultExtractionSchemaId !== null
    ) {
      this._defaultExtractionSchemaId =
        typeof props.defaultExtractionSchemaId === 'string'
          ? ExtractionSchemaId.from(props.defaultExtractionSchemaId)
          : props.defaultExtractionSchemaId;
    } else {
      this._defaultExtractionSchemaId = null;
    }

    this.createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  public static create(props: ClinicCreateProps): Clinic {
    return new Clinic(props);
  }

  public static register(props: ClinicCreateProps): Clinic {
    return new Clinic(props);
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

  public async verifyPassword(
    candidatePassword: string,
    verifier: PasswordVerifier,
  ): Promise<void> {
    const isValid = await verifier(candidatePassword, this._passwordHash.value);

    if (!isValid) {
      throw new ClinicInvalidCredentialsError();
    }
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
