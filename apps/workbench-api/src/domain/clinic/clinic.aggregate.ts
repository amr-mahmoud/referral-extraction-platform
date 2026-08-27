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
import type { ClinicInputProps } from './types';

const MIN_PASSWORD_LENGTH = 8;
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,50}$/;

export class InvalidClinicIdError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.INVALID_CLINIC_ID;

  constructor(id: unknown) {
    super(DOMAIN_ERROR.INVALID_CLINIC_ID, `Invalid clinic id: '${String(id)}'`);
  }
}

export class Clinic {
  id: string;
  clinicName: string;
  username: string;
  private _passwordHash: PasswordHash;
  private _defaultExtractionSchemaId: string | null;
  private _extractionSchemas: ExtractionSchema[];
  createdAt: Date;
  private _updatedAt: Date;

  public constructor(props: ClinicInputProps) {
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
    this._extractionSchemas = props.extractionSchemas ?? [];

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

  /** The clinic's related extraction schemas, hydrated at construction or via `updateRelationSchemas`. */
  public get extractionSchemas(): ExtractionSchema[] {
    return this._extractionSchemas;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  /** Hydrates the clinic's schema relations from full aggregates (the Postgres read path). */
  public updateRelationSchemas(extractionSchemas: ExtractionSchema[]): void {
    this._extractionSchemas = extractionSchemas;
  }

  /**
   * Resolves the extraction schema that applies to this clinic:
   * - an explicitly requested id (valid only if it is one of this clinic's
   *   schemas), or
   * - the clinic's default schema.
   *
   * Returns `null` when no schema applies (no default configured) or the
   * requested schema is not among the loaded relations — callers fall back to
   * Postgres and treat a still-missing requested id as not-found.
   */
  public findExtractionSchema(
    extractionSchemaId?: string | null,
  ): ExtractionSchema | null {
    if (extractionSchemaId) {
      return (
        this._extractionSchemas.find(
          (schema) => schema.id === extractionSchemaId,
        ) ?? null
      );
    }
    if (!this._defaultExtractionSchemaId) {
      return null;
    }
    return (
      this._extractionSchemas.find(
        (schema) => schema.id === this._defaultExtractionSchemaId,
      ) ?? null
    );
  }

  public async verifyPassword(
    candidatePassword: string,
    verifier: PasswordVerifier,
  ): Promise<void> {
    try {
      const isValid = await verifier(
        candidatePassword,
        this._passwordHash.value,
      );
      if (!isValid) {
        throw new ClinicInvalidCredentialsError();
      }
    } catch (error) {
      // The aggregate only ever surfaces domain exceptions: a raw verifier or
      // infrastructure failure is treated as invalid credentials (fail-closed),
      // never leaked up the stack as an unhandled error.
      if (error instanceof DomainException) {
        throw error;
      }
      throw new ClinicInvalidCredentialsError();
    }
  }

  public changeDefaultSchema(extractionSchemaId: string | null): void {
    if (
      extractionSchemaId !== null &&
      (typeof extractionSchemaId !== 'string' ||
        extractionSchemaId.trim() === '')
    ) {
      throw new ClinicValidationError(
        'Default extraction schema id must be a non-empty string or null',
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
