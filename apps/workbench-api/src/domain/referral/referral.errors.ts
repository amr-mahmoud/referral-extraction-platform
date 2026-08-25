import { DomainError } from '../shared/domain.error';

export enum ReferralErrorCode {
  INVALID_PATIENT_NAME = 'INVALID_PATIENT_NAME',
  INVALID_FILE_NAME = 'INVALID_FILE_NAME',
  REFERRAL_NOT_FOUND = 'REFERRAL_NOT_FOUND',
  SCHEMA_ALREADY_FIXED = 'SCHEMA_ALREADY_FIXED',
  CORRECTION_NOT_ALLOWED = 'CORRECTION_NOT_ALLOWED',
}

export class ReferralValidationError extends DomainError {
  public readonly code = ReferralErrorCode.INVALID_PATIENT_NAME;

  constructor(message: string) {
    super(message);
  }
}

export class ReferralFileNameError extends DomainError {
  public readonly code = ReferralErrorCode.INVALID_FILE_NAME;

  constructor(message: string) {
    super(message);
  }
}

export class ReferralNotFoundError extends DomainError {
  public readonly code = ReferralErrorCode.REFERRAL_NOT_FOUND;

  constructor(referralId: string) {
    super(`Referral with id '${referralId}' was not found`);
  }
}

export class ReferralSchemaAlreadyFixedError extends DomainError {
  public readonly code = ReferralErrorCode.SCHEMA_ALREADY_FIXED;

  constructor(referralId: string) {
    super(`Extraction schema for referral '${referralId}' is already fixed`);
  }
}

export class ReferralCorrectionNotAllowedError extends DomainError {
  public readonly code = ReferralErrorCode.CORRECTION_NOT_ALLOWED;

  constructor(referralId: string) {
    super(`Referral '${referralId}' cannot be corrected in its current state`);
  }
}
