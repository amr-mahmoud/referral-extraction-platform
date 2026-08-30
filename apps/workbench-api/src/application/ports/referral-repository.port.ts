import { Referral } from '../../domain/referral/referral.aggregate';
import type { ReferralData } from '../types';

export const REFERRAL_REPOSITORY_PORT = 'REFERRAL_REPOSITORY_PORT';

export interface ReferralRepositoryPort {
  /** Single-referral read-model query — the cache-aside fallback for one id. */
  findReferralById(id: string): Promise<ReferralData | null>;
  /** Persists all referrals atomically — either every row lands or none do. */
  saveReferrals(referrals: Referral[]): Promise<Referral[]>;
  /**
   * Compensating rollback: deletes the just-created rows when their cache
   * write failed (the all-or-nothing cache-aside path). Best-effort by
   * design — called only to restore the pre-request state after a failure.
   */
  deleteReferralsByIds(referralIds: string[]): Promise<void>;

  /** Newest-first. The Postgres fallback when the clinic index is a cache miss. */
  findReferralsByClinicId(clinicId: string): Promise<ReferralData[]>;
  /** Backfills the specific referrals that missed the cache. */
  findManyReferralsByIds(referralIds: string[]): Promise<ReferralData[]>;
  /** Every referral in the database — used only by the dev cache warm-up. */
  findAllReferrals(): Promise<ReferralData[]>;
}
