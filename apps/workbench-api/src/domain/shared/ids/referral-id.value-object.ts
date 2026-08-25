import {
  InvalidReferralIdError,
  Referral,
} from '../../referral/referral.aggregate';

export { InvalidReferralIdError };

export type ReferralId = string;
export const ReferralId = {
  from: (id: string): string => Referral.validateId(id),
  generate: (): string => Referral.generateId(),
};
