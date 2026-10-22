import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AppLogger } from '../../../libs/logger';
import { Client } from 'pg';
import { Subject, type Observable } from 'rxjs';
import type {
  ReferralChangedNotification,
  ReferralNotificationPort,
} from '../../application/ports/referral-notification.port';

const NOTIFY_CHANNEL = 'referral_changed';
const RECONNECT_DELAY_MS = 2000;

/**
 * Design-doc step 9. Holds one dedicated `pg` connection parked on
 * `LISTEN referral_changed` and republishes each ping as an RxJS event.
 *
 * A raw `pg` client rather than Prisma on purpose: Prisma has no API for
 * LISTEN/NOTIFY — it needs a long-lived session that stays open and receives
 * asynchronous server-pushed messages, which the query-oriented client can't
 * express.
 *
 * The payload carries only ids and status, never `extractedPayload` — NOTIFY
 * is capped at 8KB and an extracted referral can exceed it. Consumers treat
 * the ping as "this changed, go read it".
 */
@Injectable()
export class PostgresListenService
  implements ReferralNotificationPort, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new AppLogger(PostgresListenService.name);
  private readonly referralChanged$ =
    new Subject<ReferralChangedNotification>();
  private client: Client | null = null;
  private isShuttingDown = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  public async onModuleInit(): Promise<void> {
    await this.connectAndListen();
  }

  public async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.referralChanged$.complete();
    await this.closeClient();
  }

  /** Every referral change ping, for the whole database — consumers filter by clinic. */
  public observeReferralChanges(): Observable<ReferralChangedNotification> {
    return this.referralChanged$.asObservable();
  }

  private async connectAndListen(): Promise<void> {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL must be set to listen for referral change notifications',
      );
    }

    try {
      const client = new Client({ connectionString });

      // A dropped listener is silent — no error surfaces on the API's other
      // queries, the dashboard just stops updating. Reconnect rather than
      // leaving the stream quietly dead.
      client.on('error', (error) => {
        this.logger.error(`LISTEN connection error: ${error.message}`);
        this.scheduleReconnect();
      });
      client.on('end', () => {
        if (!this.isShuttingDown) {
          this.logger.warn('LISTEN connection ended; reconnecting');
          this.scheduleReconnect();
        }
      });

      client.on('notification', (message) => {
        if (!message.payload) {
          return;
        }
        try {
          this.referralChanged$.next(
            JSON.parse(message.payload) as ReferralChangedNotification,
          );
        } catch (error) {
          this.logger.error(
            `Unparseable ${NOTIFY_CHANNEL} payload: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      });

      await client.connect();
      await this.ensureNotifyTrigger(client);
      await client.query(`LISTEN ${NOTIFY_CHANNEL}`);
      this.client = client;
      this.logger.log(`Listening on Postgres channel "${NOTIFY_CHANNEL}"`);
    } catch (error) {
      this.logger.error(
        `Failed to start LISTEN: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      this.scheduleReconnect();
    }
  }

  private async ensureNotifyTrigger(client: Client): Promise<void> {
    try {
      await client.query(`
        CREATE OR REPLACE FUNCTION notify_referral_changed() RETURNS trigger AS $$
        BEGIN
          PERFORM pg_notify(
            '${NOTIFY_CHANNEL}',
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

        CREATE TRIGGER referral_changed_notify
        AFTER INSERT OR UPDATE OF status, extracted_payload, patient_name, error_message
        ON referrals
        FOR EACH ROW
        EXECUTE FUNCTION notify_referral_changed();
      `);
      this.logger.log('Referral change NOTIFY trigger verified in database');
    } catch (error) {
      this.logger.warn(
        `Could not auto-apply NOTIFY trigger (database may still be initializing): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private scheduleReconnect(): void {
    if (this.isShuttingDown || this.reconnectTimer) {
      return;
    }
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.closeClient().then(() => this.connectAndListen());
    }, RECONNECT_DELAY_MS);
  }

  private async closeClient(): Promise<void> {
    if (!this.client) {
      return;
    }
    const client = this.client;
    this.client = null;
    try {
      await client.end();
    } catch {
      // Already dead — nothing useful to do, and this runs on the reconnect path.
    }
  }
}
