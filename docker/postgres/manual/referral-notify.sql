-- Design-doc step 9: "Real-Time Notification (Notify + Fetch)".
--
-- The payload is deliberately tiny — referral id, clinic id, status — never the
-- extracted_payload. Postgres NOTIFY has an 8KB payload ceiling and a fully
-- extracted referral can exceed it, so the ping only says "this referral
-- changed"; the API then does a primary-key SELECT to fetch the heavy row and
-- pushes that down the open SSE connection.
--
-- NOT auto-run: this file deliberately lives outside docker/postgres/init/.
-- `PostgresListenService.ensureNotifyTrigger()` (apps/workbench-api/src/
-- infrastructure/notifications/postgres-listen.service.ts) already applies
-- this exact function + trigger, idempotently, every time the API connects —
-- which only ever happens after `prisma migrate deploy` has created the
-- `referrals` table. Putting an equivalent script back in init/ would run
-- during Postgres's own first-boot init, before that table exists, which (a)
-- would fail with "relation referrals does not exist" and (b) Postgres's
-- entrypoint treats init-script failures as fatal, so it would take the whole
-- database down. Kept here only for manual/ad-hoc use via `make db-apply-notify`.

CREATE OR REPLACE FUNCTION notify_referral_changed() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify(
    'referral_changed',
    json_build_object(
      'referralId', NEW.id,
      'clinicId', NEW.clinic_id,
      'status', NEW.status
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS referral_changed_notify ON referrals;

-- Fires on insert (a new PENDING slot appearing in the dashboard) and
-- on the columns the worker actually mutates. Scoping the UPDATE to those
-- columns keeps unrelated writes from waking every connected SSE client.
CREATE TRIGGER referral_changed_notify
AFTER INSERT OR UPDATE OF status, extracted_payload, patient_name, error_message
ON referrals
FOR EACH ROW
EXECUTE FUNCTION notify_referral_changed();
