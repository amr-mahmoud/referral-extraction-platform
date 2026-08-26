import { DOMAIN_ERROR } from '../../../libs/errors/domain-error-code.enum';
import { DomainException } from '../shared/domain.exception';

export class ReferralValidationError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.REFERRAL_INVALID_PATIENT_NAME;

  constructor(message: string) {
    super(DOMAIN_ERROR.REFERRAL_INVALID_PATIENT_NAME, message);
  }
}

export class ReferralFileNameError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.REFERRAL_INVALID_FILE_NAME;

  constructor(message: string) {
    super(DOMAIN_ERROR.REFERRAL_INVALID_FILE_NAME, message);
  }
}

export class ReferralNotFoundError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.REFERRAL_NOT_FOUND;

  constructor(referralId: string) {
    super(
      DOMAIN_ERROR.REFERRAL_NOT_FOUND,
      `Referral with id '${referralId}' was not found`,
    );
  }
}

export class ReferralSchemaAlreadyFixedError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.REFERRAL_SCHEMA_ALREADY_FIXED;

  constructor(referralId: string) {
    super(
      DOMAIN_ERROR.REFERRAL_SCHEMA_ALREADY_FIXED,
      `Extraction schema for referral '${referralId}' is already fixed`,
    );
  }
}

export class ReferralCorrectionNotAllowedError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.REFERRAL_CORRECTION_NOT_ALLOWED;

  constructor(referralId: string) {
    super(
      DOMAIN_ERROR.REFERRAL_CORRECTION_NOT_ALLOWED,
      `Referral '${referralId}' cannot be corrected in its current state`,
    );
  }
}
