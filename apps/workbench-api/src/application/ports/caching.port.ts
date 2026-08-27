import { CachedClinic, CachedReferral } from '../types';

export const CACHING_SERVICE_PORT = 'CACHING_SERVICE_PORT';

export interface CachingServicePort {
  /**
   * Writes the single flat `CachedReferral` for each referral — the same
   * object the worker reads from `referral:{id}` and the API serves to the
   * web. Read-modify-write: the fresh projection fields land whole while the
   * static `extractionSchema` is carried forward from the existing entry.
   */
  setCachedReferrals(entries: CachedReferral[]): Promise<void>;
  getCachedReferral(referralId: string): Promise<CachedReferral | null>;
  getManyCachedReferrals(
    referralIds: string[],
  ): Promise<(CachedReferral | null)[]>;

  /** Secondary index: adds referral ids to `clinic:{clinicId}:referrals`. */
  addReferralIdsToClinicIndex(
    clinicId: string,
    referralIds: string[],
  ): Promise<void>;
  /**
   * Returns `null` (not `[]`) when the index key does not exist, so callers can
   * tell "this clinic genuinely has no referrals" apart from "nothing cached
   * yet, go read Postgres".
   */
  getClinicReferralIds(clinicId: string): Promise<string[] | null>;

  /** Full-clinic cache-aside entry, hydrated with the clinic's extraction schemas. */
  getFullClinic(clinicId: string): Promise<CachedClinic | null>;
  setFullClinic(clinic: CachedClinic): Promise<void>;

  /**
   * Compensating rollback: removes the referral hashes and clinic-index
   * entries written for a batch that failed to persist. Idempotent — DEL/SREM
   * of keys that may or may not exist.
   */
  deleteReferralsToCache(
    clinicId: string,
    referralIds: string[],
  ): Promise<void>;
}
