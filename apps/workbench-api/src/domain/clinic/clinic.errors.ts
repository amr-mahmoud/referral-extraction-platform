import { DOMAIN_ERROR } from '../../../libs/errors/domain-error-code.enum';
import { DomainException } from '../shared/domain.exception';

export class ClinicValidationError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.CLINIC_INVALID_NAME;

  constructor(message: string) {
    super(DOMAIN_ERROR.CLINIC_INVALID_NAME, message);
  }
}

export class ClinicNotFoundError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.CLINIC_NOT_FOUND;

  constructor(clinicId: string) {
    super(
      DOMAIN_ERROR.CLINIC_NOT_FOUND,
      `Clinic with id '${clinicId}' was not found`,
    );
  }
}

export class ClinicUsernameTakenError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.CLINIC_USERNAME_TAKEN;

  constructor(username: string) {
    super(
      DOMAIN_ERROR.CLINIC_USERNAME_TAKEN,
      `Username '${username}' is already registered`,
    );
  }
}

export class ClinicInvalidCredentialsError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.CLINIC_INVALID_CREDENTIALS;

  constructor() {
    super(
      DOMAIN_ERROR.CLINIC_INVALID_CREDENTIALS,
      'Invalid clinic credentials',
    );
  }
}

export class ClinicWeakPasswordError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.CLINIC_WEAK_PASSWORD;

  constructor(minLength: number) {
    super(
      DOMAIN_ERROR.CLINIC_WEAK_PASSWORD,
      `Password must be at least ${minLength} characters long`,
    );
  }
}

export class ClinicInvalidUsernameFormatError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.CLINIC_INVALID_USERNAME_FORMAT;

  constructor() {
    super(
      DOMAIN_ERROR.CLINIC_INVALID_USERNAME_FORMAT,
      'Username must be 3–50 characters and contain only letters, numbers, and underscores',
    );
  }
}
