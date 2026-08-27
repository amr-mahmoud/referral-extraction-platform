import { DOMAIN_ERROR } from '../../../libs/errors/domain-error-code.enum';
import { DomainException } from '../shared/domain.exception';
import { ReferralStatusValue } from './types';

export class InvalidReferralStatusError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.REFERRAL_INVALID_STATUS;

  constructor(value: string) {
    super(
      DOMAIN_ERROR.REFERRAL_INVALID_STATUS,
      `'${value}' is not a valid referral status`,
    );
  }
}

export class InvalidReferralStatusTransitionError extends DomainException {
  public readonly errorCode = DOMAIN_ERROR.REFERRAL_INVALID_STATUS_TRANSITION;

  constructor(from: ReferralStatusValue, to: ReferralStatusValue) {
    super(
      DOMAIN_ERROR.REFERRAL_INVALID_STATUS_TRANSITION,
      `Referral cannot transition from '${from}' to '${to}'`,
    );
  }
}

const ALLOWED_TRANSITIONS: Record<
  ReferralStatusValue,
  readonly ReferralStatusValue[]
> = {
  [ReferralStatusValue.AWAITING_UPLOAD]: [
    ReferralStatusValue.PENDING,
    ReferralStatusValue.PROCESSING,
    ReferralStatusValue.FAILED,
  ],
  [ReferralStatusValue.PENDING]: [
    ReferralStatusValue.PROCESSING,
    ReferralStatusValue.FAILED,
  ],
  [ReferralStatusValue.PROCESSING]: [
    ReferralStatusValue.COMPLETED,
    ReferralStatusValue.FAILED,
    ReferralStatusValue.REJECTED,
  ],
  [ReferralStatusValue.COMPLETED]: [],
  [ReferralStatusValue.FAILED]: [],
  [ReferralStatusValue.REJECTED]: [],
};

export class ReferralStatus {
  private constructor(public readonly value: ReferralStatusValue) {}

  public static from(value: string | ReferralStatusValue): ReferralStatus {
    if (typeof value !== 'string' || !(value in ReferralStatusValue)) {
      throw new InvalidReferralStatusError(String(value));
    }
    return new ReferralStatus(value as ReferralStatusValue);
  }

  public canTransitionTo(next: ReferralStatus): boolean {
    return ALLOWED_TRANSITIONS[this.value].includes(next.value);
  }

  public assertCanTransitionTo(next: ReferralStatus): void {
    if (!this.canTransitionTo(next)) {
      throw new InvalidReferralStatusTransitionError(this.value, next.value);
    }
  }

  public equals(other: ReferralStatus): boolean {
    return this.value === other.value;
  }
}
