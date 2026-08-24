import { DomainError } from '../domain.error';

export class InvalidReferralIdError extends DomainError {
  public readonly code = 'INVALID_REFERRAL_ID';

  constructor(id: unknown) {
    super(`Invalid referral id: '${String(id)}'`);
  }
}

export class ReferralId {
  private constructor(public readonly value: string) {}

  public static from(value: string): ReferralId {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new InvalidReferralIdError(value);
    }
    return new ReferralId(value);
  }

  public equals(other: ReferralId): boolean {
    return this.value === other.value;
  }
}
