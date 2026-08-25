import { DomainError } from '../shared/domain.error';

export class InvalidReferralStatusError extends DomainError {
  public readonly code = 'INVALID_REFERRAL_STATUS';

  constructor(value: string) {
    super(`'${value}' is not a valid referral status`);
  }
}

export class InvalidReferralStatusTransitionError extends DomainError {
  public readonly code = 'INVALID_REFERRAL_STATUS_TRANSITION';

  constructor(from: ReferralStatusValue, to: ReferralStatusValue) {
    super(`Referral cannot transition from '${from}' to '${to}'`);
  }
}

export enum ReferralStatusValue {
  AWAITING_UPLOAD = 'AWAITING_UPLOAD',
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
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
