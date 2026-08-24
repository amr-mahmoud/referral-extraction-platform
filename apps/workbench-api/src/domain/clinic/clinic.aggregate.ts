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
  id: ClinicId;
  clinicName: string;
  username: string;
  passwordHash: PasswordHash;
  defaultExtractionSchemaId?: ExtractionSchemaId | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClinicRegisterProps {
  id: ClinicId;
  clinicName: string;
  username: string;
  rawPassword: string;
  hashedPassword: string;
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

  /**
   * Reconstitutes a Clinic aggregate from persistence data.
   * No business rules are enforced beyond constructor invariants
   * because the data was already validated when originally created.
   */
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

  /**
   * Business-intent factory for registering a brand-new clinic.
   * Enforces username format and password strength policies.
   * The password must be pre-hashed by the application layer via EncryptionPort
   * before reaching the domain — the domain never touches plaintext hashing,
   * but it validates the raw password meets strength requirements.
   */
  public static register(props: ClinicRegisterProps): Clinic {
    if (!USERNAME_PATTERN.test(props.username)) {
      throw new ClinicInvalidUsernameFormatError();
    }

    if (props.rawPassword.length < MIN_PASSWORD_LENGTH) {
      throw new ClinicWeakPasswordError(MIN_PASSWORD_LENGTH);
    }

    const passwordHash = PasswordHash.from(props.hashedPassword);
    const now = new Date();

    return new Clinic(
      props.id,
      props.clinicName,
      props.username,
      passwordHash,
      null,
      now,
      now,
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

  /**
   * Verifies that a candidate plain-text password matches this clinic's
   * stored hash. The aggregate owns the decision; the actual comparison
   * algorithm is injected as a pure function to keep the domain free
   * of infrastructure imports.
   */
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
