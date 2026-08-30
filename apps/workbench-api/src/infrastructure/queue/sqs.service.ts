import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
  type Message,
} from '@aws-sdk/client-sqs';
import { ApplicationService } from '../../application/application.service';
import type { QueueServicePort } from '../../application/ports/queue-service.port';
import { WORKER_REFERRAL_STATUSES } from '../../application/types';
import type { ReferralStatusUpdateEvent } from '../../application/types';

const LONG_POLL_WAIT_SECONDS = 20;
const MAX_MESSAGES_PER_RECEIVE = 10;

/**
 * Infrastructure adapter for the status-update queue (the worker publishes
 * results here instead of writing Postgres). Implements the application
 * `QueueServicePort` and does NOT touch repositories directly — every message
 * is handed to the `ApplicationService` use case, which owns validation and
 * the atomic DB transition. That write fires the Postgres trigger →
 * LISTEN/NOTIFY → cache-refresh → SSE pipeline, so the transport is only the
 * event source.
 *
 * Long-polls (WaitTimeSeconds 20) so an idle queue costs nothing while a
 * fresh message is delivered almost immediately.
 */
@Injectable()
export class SqsService
  implements QueueServicePort, OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(SqsService.name);
  private readonly client: SQSClient;
  private readonly queueUrl: string;
  private stopped = false;
  private pollLoopPromise: Promise<void> | null = null;

  public constructor(private readonly applicationService: ApplicationService) {
    const queueUrl = process.env.SQS_STATUS_UPDATE_URL;
    if (!queueUrl || queueUrl.trim() === '') {
      throw new Error(
        'SQS_STATUS_UPDATE_URL must be set to consume referral status updates',
      );
    }
    this.queueUrl = queueUrl;
    this.client = new SQSClient({
      region: process.env.AWS_REGION ?? 'us-east-1',
    });
  }

  public onApplicationBootstrap(): void {
    this.startConsuming();
  }

  public onModuleDestroy(): Promise<void> {
    return this.shutdown();
  }

  public startConsuming(): void {
    this.pollLoopPromise = this.runPollLoop();
  }

  public async shutdown(): Promise<void> {
    this.stopped = true;
    if (this.pollLoopPromise) {
      await this.pollLoopPromise;
    }
    this.client.destroy();
  }

  private async runPollLoop(): Promise<void> {
    this.logger.log(`Polling SQS status-update queue ${this.queueUrl}...`);
    let consecutivePollFailures = 0;
    while (!this.stopped) {
      try {
        const response = await this.client.send(
          new ReceiveMessageCommand({
            QueueUrl: this.queueUrl,
            MaxNumberOfMessages: MAX_MESSAGES_PER_RECEIVE,
            WaitTimeSeconds: LONG_POLL_WAIT_SECONDS,
          }),
        );
        consecutivePollFailures = 0;

        const messages = response.Messages ?? [];
        for (const message of messages) {
          await this.handleMessage(message);
        }
      } catch (error) {
        // Transient network/DNS errors must not kill the consumer — log,
        // back off briefly, and keep polling.
        consecutivePollFailures += 1;
        this.logger.error(
          `Poll failed (attempt ${consecutivePollFailures}): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        await this.backoffAfterTransientPollFailure(consecutivePollFailures);
      }
    }
    this.logger.log('SQS status-update consumer stopped.');
  }

  private async handleMessage(message: Message): Promise<void> {
    const receiptHandle = message.ReceiptHandle;
    if (!receiptHandle || !message.Body) {
      return;
    }

    const event = this.parseStatusUpdateEvent(message.Body);
    if (!event) {
      // Poison-pill handling: a structurally invalid event will never become
      // valid, so delete it rather than redelivering forever. The worker
      // publishes the same shape, so this is a bug signal, logged loudly.
      this.logger.error(
        `Dropping structurally invalid status-update message: ${message.Body.slice(0, 500)}`,
      );
      await this.deleteMessage(receiptHandle);
      return;
    }

    try {
      await this.applicationService.applyReferralStatusUpdate(event);
      await this.deleteMessage(receiptHandle);
      this.logger.log(
        `Consumed status update for referral ${event.referralId}: ${event.status}`,
      );
    } catch (error) {
      // Leave the message for redelivery — a transient DB failure must not
      // lose the result.
      this.logger.error(
        `Failed to apply status update for referral ${event.referralId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private parseStatusUpdateEvent(
    body: string,
  ): ReferralStatusUpdateEvent | null {
    try {
      const parsed = JSON.parse(body) as Partial<ReferralStatusUpdateEvent>;
      if (
        typeof parsed?.referralId !== 'string' ||
        typeof parsed?.clinicId !== 'string' ||
        !WORKER_REFERRAL_STATUSES.includes(
          parsed.status as ReferralStatusUpdateEvent['status'],
        )
      ) {
        return null;
      }
      return {
        referralId: parsed.referralId,
        clinicId: parsed.clinicId,
        status: parsed.status as ReferralStatusUpdateEvent['status'],
        extractedPayload: Array.isArray(parsed.extractedPayload)
          ? parsed.extractedPayload
          : [],
        patientName: parsed.patientName ?? null,
        extractionSchemaId: parsed.extractionSchemaId ?? null,
        errorMessage: parsed.errorMessage ?? null,
        extractedAt: parsed.extractedAt ?? new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  private async deleteMessage(receiptHandle: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteMessageCommand({
          QueueUrl: this.queueUrl,
          ReceiptHandle: receiptHandle,
        }),
      );
    } catch (error) {
      this.logger.error(
        `DeleteMessage failed (likely already deleted): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async backoffAfterTransientPollFailure(
    consecutivePollFailures: number,
  ): Promise<void> {
    const backoffSeconds = Math.min(consecutivePollFailures, 5);
    await new Promise((resolve) => setTimeout(resolve, backoffSeconds * 1000));
  }
}
