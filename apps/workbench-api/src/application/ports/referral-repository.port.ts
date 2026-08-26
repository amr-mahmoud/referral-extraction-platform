import { Referral } from '../../domain/referral/referral.aggregate';
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
  findReferralById(id: string): Promise<Referral | null>;
  findReferralByIdForClinic(
    id: string,
    clinicId: string,
  ): Promise<Referral | null>;
  findPaginatedReferralsByClinicId(
    clinicId: string,
    options: ListReferralOptions,
  ): Promise<Paginated<Referral>>;
  saveReferral(referral: Referral): Promise<Referral>;
  /** Persists all referrals atomically — either every row lands or none do. */
  saveReferrals(referrals: Referral[]): Promise<Referral[]>;
  /**
   * Compensating rollback: deletes the just-created rows when their cache
   * write failed (the all-or-nothing cache-aside path). Best-effort by
   * design — called only to restore the pre-request state after a failure.
   */
  deleteReferralsByIds(referralIds: string[]): Promise<void>;

  // ── Read-model queries (the cache-aside fallback path) ────────────────
  // These return `ReferralView`, not the aggregate: they join the extraction
  // schema's version for the dashboard label, and are only ever read.

  /** Newest-first. The Postgres fallback when the clinic index is a cache miss. */
  findReferralViewsByClinicId(clinicId: string): Promise<ReferralView[]>;
  /** Backfills the specific referrals that missed the cache. */
  findReferralViewsByIds(referralIds: string[]): Promise<ReferralView[]>;
  /** Every referral in the database — used only by the dev cache warm-up. */
  findAllReferralViews(): Promise<ReferralView[]>;
}
