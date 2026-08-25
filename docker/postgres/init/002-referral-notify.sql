-- Design-doc step 9: "Real-Time Notification (Notify + Fetch)".
--
-- The payload is deliberately tiny — referral id, clinic id, status — never the
-- extracted_payload. Postgres NOTIFY has an 8KB payload ceiling and a fully
-- extracted referral can exceed it, so the ping only says "this referral
-- changed"; the API then does a primary-key SELECT to fetch the heavy row and
-- pushes that down the open SSE connection.
--
-- Written idempotently (CREATE OR REPLACE + DROP TRIGGER IF EXISTS) because
-- files in this directory only auto-run against an EMPTY data volume — an
-- existing database needs this applied manually via `make db-apply-notify`.

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

-- Fires on insert (a new AWAITING_UPLOAD slot appearing in the dashboard) and
-- on the columns the worker actually mutates. Scoping the UPDATE to those
-- columns keeps unrelated writes from waking every connected SSE client.
CREATE TRIGGER referral_changed_notify
AFTER INSERT OR UPDATE OF status, extracted_payload, patient_name, error_message
ON referrals
FOR EACH ROW
EXECUTE FUNCTION notify_referral_changed();
