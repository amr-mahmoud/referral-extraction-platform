import { Referral } from '../../domain/referral/referral.aggregate';
import { ClinicId } from '../../domain/shared/ids/clinic-id.value-object';
import { ReferralId } from '../../domain/shared/ids/referral-id.value-object';

export const REFERRAL_REPOSITORY_PORT = 'REFERRAL_REPOSITORY_PORT';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ListReferralOptions {
  page: number;
  limit: number;
}

export interface ReferralRepositoryPort {
  findReferralById(id: ReferralId): Promise<Referral | null>;
  findReferralByIdForClinic(
    id: ReferralId,
    clinicId: ClinicId,
  ): Promise<Referral | null>;
  findPaginatedReferralsByClinicId(
    clinicId: ClinicId,
    options: ListReferralOptions,
  ): Promise<Paginated<Referral>>;
  saveReferral(referral: Referral): Promise<Referral>;
  /** Persists all referrals atomically — either every row lands or none do. */
  saveReferrals(referrals: Referral[]): Promise<Referral[]>;
}
