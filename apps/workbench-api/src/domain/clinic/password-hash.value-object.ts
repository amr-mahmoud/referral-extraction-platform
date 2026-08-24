import { DomainError } from '../shared/domain.error';

export class InvalidPasswordHashError extends DomainError {
  public readonly code = 'INVALID_PASSWORD_HASH';

  constructor() {
    super('Password hash must be a non-empty hashed credential string');
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
