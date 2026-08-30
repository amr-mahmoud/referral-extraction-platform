import type { Observable } from 'rxjs';

export const REFERRAL_NOTIFICATION_PORT = 'REFERRAL_NOTIFICATION_PORT';

/**
 * The `pg_notify` payload built in `docker/postgres/init/002-referral-notify.sql` —
 * only ids and status, never the extracted payload (NOTIFY is capped at 8KB).
 */
export interface ReferralChangedNotification {
  referralId: string;
  clinicId: string;
  status: string;
}

/**
 * Design-doc step 9. A push channel of every referral status change in the
 * database — consumers filter to their own clinic, the port itself carries
 * no tenant scoping (NOTIFY is database-wide by nature).
 */
export interface ReferralNotificationPort {
  observeReferralChanges(): Observable<ReferralChangedNotification>;
}
