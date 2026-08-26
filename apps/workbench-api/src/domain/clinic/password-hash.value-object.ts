import { DOMAIN_ERROR } from '../../../libs/errors/domain-error-code.enum';
import { DomainException } from '../shared/domain.exception';

export class InvalidPasswordHashError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.CLINIC_INVALID_PASSWORD_HASH;

  constructor() {
    super(
      DOMAIN_ERROR.CLINIC_INVALID_PASSWORD_HASH,
      'Password hash must be a non-empty hashed credential string',
    );
  }
}

export class PasswordHash {
  private constructor(public readonly value: string) {}

  public static from(value: string): PasswordHash {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new InvalidPasswordHashError();
    }
    return new PasswordHash(value);
  }
}
