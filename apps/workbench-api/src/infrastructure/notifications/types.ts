/**
 * The `pg_notify` payload built in `docker/postgres/init/002-referral-notify.sql` —
 * only ids and status, never the extracted payload (NOTIFY is capped at 8KB).
 */
export interface ReferralChangedNotification {
  referralId: string;
  clinicId: string;
  status: string;
}
