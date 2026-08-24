import { DomainError } from '../shared/domain.error';

export enum ClinicErrorCode {
  INVALID_CLINIC_NAME = 'INVALID_CLINIC_NAME',
  INVALID_USERNAME = 'INVALID_USERNAME',
  INVALID_USERNAME_FORMAT = 'INVALID_USERNAME_FORMAT',
  INVALID_PASSWORD_HASH = 'INVALID_PASSWORD_HASH',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  CLINIC_NOT_FOUND = 'CLINIC_NOT_FOUND',
  USERNAME_TAKEN = 'USERNAME_TAKEN',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
}

export class ClinicValidationError extends DomainError {
  public readonly code = ClinicErrorCode.INVALID_CLINIC_NAME;

  constructor(message: string) {
    super(message);
  }
}

export class ClinicNotFoundError extends DomainError {
  public readonly code = ClinicErrorCode.CLINIC_NOT_FOUND;

  constructor(clinicId: string) {
    super(`Clinic with id '${clinicId}' was not found`);
  }
}

export class ClinicUsernameTakenError extends DomainError {
  public readonly code = ClinicErrorCode.USERNAME_TAKEN;

  constructor(username: string) {
    super(`Username '${username}' is already registered`);
  }
}

export class ClinicInvalidCredentialsError extends DomainError {
  public readonly code = ClinicErrorCode.INVALID_CREDENTIALS;

  constructor() {
    super('Invalid clinic credentials');
  }
}

export class ClinicWeakPasswordError extends DomainError {
  public readonly code = ClinicErrorCode.WEAK_PASSWORD;

  constructor(minLength: number) {
    super(`Password must be at least ${minLength} characters long`);
  }
}

export class ClinicInvalidUsernameFormatError extends DomainError {
  public readonly code = ClinicErrorCode.INVALID_USERNAME_FORMAT;

  constructor() {
    super(
      'Username must be 3–50 characters and contain only letters, numbers, and underscores',
    );
  }
}
