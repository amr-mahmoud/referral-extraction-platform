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
  findById(id: ReferralId): Promise<Referral | null>;
  findByIdForClinic(
    id: ReferralId,
    clinicId: ClinicId,
  ): Promise<Referral | null>;
  listByClinicId(
    clinicId: ClinicId,
    options: ListReferralOptions,
  ): Promise<Paginated<Referral>>;
  save(referral: Referral): Promise<Referral>;
}
