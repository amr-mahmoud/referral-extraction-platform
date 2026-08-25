import { Referral } from '../../domain/referral/referral.aggregate';
import { ClinicId } from '../../domain/shared/ids/clinic-id.value-object';
import { ReferralId } from '../../domain/shared/ids/referral-id.value-object';
import type { ReferralView } from '../read-models/referral-view.read-model';

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

  // ── Read-model queries (the cache-aside fallback path) ────────────────
  // These return `ReferralView`, not the aggregate: they join the extraction
  // schema's version for the dashboard label, and are only ever read.

  /** Newest-first. The Postgres fallback when the clinic index is a cache miss. */
  findReferralViewsByClinicId(clinicId: ClinicId): Promise<ReferralView[]>;
  /** Backfills the specific referrals that missed the cache. */
  findReferralViewsByIds(referralIds: string[]): Promise<ReferralView[]>;
  /** Every referral in the database — used only by the dev cache warm-up. */
  findAllReferralViews(): Promise<ReferralView[]>;
}
