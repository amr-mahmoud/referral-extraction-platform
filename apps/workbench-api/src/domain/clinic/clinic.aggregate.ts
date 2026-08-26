import { DOMAIN_ERROR } from '../../../libs/errors/domain-error-code.enum';
import { ExtractionSchema } from '../extraction-schema/extraction-schema.aggregate';
import {
  ClinicInvalidCredentialsError,
  ClinicInvalidUsernameFormatError,
  ClinicValidationError,
  ClinicWeakPasswordError,
} from './clinic.errors';
import { PasswordHash } from './password-hash.value-object';
import { DomainException } from '../shared/domain.exception';
import type { PasswordVerifier } from './password-verifier.type';

const MIN_PASSWORD_LENGTH = 8;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,50}$/;

export class InvalidClinicIdError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.INVALID_CLINIC_ID;

  constructor(id: unknown) {
    super(DOMAIN_ERROR.INVALID_CLINIC_ID, `Invalid clinic id: '${String(id)}'`);
  }
}

export interface ClinicCreateProps {
  /** Self-generated when absent. Expected to be a UUID string. */
  id?: string;
  clinicName: string;
  username: string;
  passwordHash?: PasswordHash | string;
  rawPassword?: string;
  hashedPassword?: string;
  /** The clinic's default extraction schema id, or `null` for the LLM default. */
  defaultExtractionSchemaId?: string | null;
  /** Ids of the clinic's related extraction schemas (cache/read hydration). */
  extractionSchemaIds?: string[];
  /** Ids of the clinic's referrals (cache/read hydration). */
  referralIds?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class Clinic {
  id: string;
  clinicName: string;
  username: string;
  private _passwordHash: PasswordHash;
  private _defaultExtractionSchemaId: string | null;
  private _extractionSchemaIds: string[];
  private _referralIds: string[];
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

    this.id =
      props.id !== undefined && props.id !== null
        ? this.validateId(props.id)
        : this.generateId();

    this.clinicName = props.clinicName.trim();
    this.username = props.username;
    this._passwordHash = passwordHash;
    this._defaultExtractionSchemaId = props.defaultExtractionSchemaId ?? null;
    this._extractionSchemaIds = props.extractionSchemaIds ?? [];
    this._referralIds = props.referralIds ?? [];

    this.createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  public readonly generateId = (): string => crypto.randomUUID();

  public readonly validateId = (id: string): string => {
    if (typeof id !== 'string' || id.trim() === '') {
      throw new InvalidClinicIdError(id);
    }
    return id.trim();
  };

  public get passwordHash(): PasswordHash {
    return this._passwordHash;
  }

  public get defaultExtractionSchemaId(): string | null {
    return this._defaultExtractionSchemaId;
  }

  /** Ids of the clinic's related extraction schemas, hydrated at construction or via `updateRelationSchemas`. */
  public get extractionSchemaIds(): string[] {
    return this._extractionSchemaIds;
  }

  /** Ids of the clinic's referrals, hydrated at construction via `referralIds`. */
  public get referralIds(): string[] {
    return this._referralIds;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Hydrates the clinic's schema relations from full aggregates (the Postgres
   * read path) — stores only their ids.
   */
  public updateRelationSchemas(extractionSchemas: ExtractionSchema[]): void {
    this._extractionSchemaIds = extractionSchemas.map((schema) => schema.id);
  }

  /**
   * Resolves the id of the extraction schema that applies to this clinic:
   * - an explicitly requested id (valid only if it is one of this clinic's
   *   schemas), or
   * - the clinic's default schema.
   *
   * Returns `null` when no schema applies (no default configured) or the
   * requested schema is not among the loaded relations — callers fall back to
   * Postgres and treat a still-missing requested id as not-found. The full
   * schema payload is fetched separately once the id is known.
   */
  public findExtractionSchema(
    extractionSchemaId?: string | null,
  ): string | null {
    if (extractionSchemaId) {
      return this._extractionSchemaIds.includes(extractionSchemaId)
        ? extractionSchemaId
        : null;
    }
    if (!this._defaultExtractionSchemaId) {
      return null;
    }
    return this._extractionSchemaIds.includes(this._defaultExtractionSchemaId)
      ? this._defaultExtractionSchemaId
      : null;
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

  public changeDefaultSchema(extractionSchemaId: string | null): void {
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
