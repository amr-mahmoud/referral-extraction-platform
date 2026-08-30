import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
  type Message,
} from '@aws-sdk/client-sqs';
import {
  parseReferralObjectKey,
  type S3ObjectCreatedEvent,
} from '../../types/sqs-message.types';
import {
  type ReferralJobContext,
  type ReferralJobResult,
} from '../../types/referral-job.types';

export interface SqsConsumerOptions {
  region: string;
  queueUrl: string;
  maxConcurrentMessages: number;
  pollWaitSeconds: number;
  onMessage: (context: ReferralJobContext) => Promise<ReferralJobResult>;
}

export class SqsConsumerService {
  private readonly client: SQSClient;
  private stopped = false;

  public constructor(private readonly options: SqsConsumerOptions) {
    this.client = new SQSClient({ region: options.region });
  }

  /**
   * Runs `maxConcurrentMessages` lanes in parallel until every one of them
   * has been told to stop. Each lane only ever asks SQS for a single
   * message at a time (`MaxNumberOfMessages: 1`) — deliberately not a
   * batch of several per lane, which would just reintroduce the same
   * "wait for the whole batch's slowest job" bottleneck this replaces, one
   * level down. See `concurrency-fix-plan.md` for the full reasoning.
   */
  public async start(): Promise<void> {
    console.log(
      `[SQS] Polling ${this.options.queueUrl} with ${this.options.maxConcurrentMessages} lane(s)...`,
    );
    const lanes = Array.from(
      { length: this.options.maxConcurrentMessages },
      (_, index) => this.runLane(index),
    );
    await Promise.all(lanes);
    console.log('[SQS] All lanes stopped.');
  }

  private async runLane(laneIndex: number): Promise<void> {
    let consecutivePollFailures = 0;
    while (!this.stopped) {
      try {
        const response = await this.client.send(
          new ReceiveMessageCommand({
            QueueUrl: this.options.queueUrl,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: this.options.pollWaitSeconds,
          }),
        );
        consecutivePollFailures = 0;

        const [message] = response.Messages ?? [];
        if (!message) {
          continue;
        }

        await this.handleMessage(message);
      } catch (error) {
        // Transient network/DNS errors (e.g. ENOTFOUND for sqs.us-east-1...)
        // must not kill this lane: log, back off briefly, and keep polling.
        // Each lane tracks its own failure count and backs off independently
        // — one lane hitting a blip doesn't slow the others down.
        consecutivePollFailures += 1;
        console.error(
          `[SQS] Lane ${laneIndex} poll failed (attempt ${consecutivePollFailures}): ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        await this.backoffAfterTransientPollFailure(consecutivePollFailures);
      }
    }
  }

  /**
   * Caps the retry backoff at 5s so a persistent outage backs off without
   * hammering DNS/network, while a one-off blip recovers almost immediately.
   */
  private async backoffAfterTransientPollFailure(
    consecutivePollFailures: number,
  ): Promise<void> {
    const backoffSeconds = Math.min(consecutivePollFailures, 5);
    await new Promise((resolve) => setTimeout(resolve, backoffSeconds * 1000));
  }

  private async handleMessage(message: Message): Promise<void> {
    const receiptHandle = message.ReceiptHandle;
    if (!receiptHandle || !message.Body) {
      return;
    }

    const parsed = this.parseSqsBody(message.Body);
    if (!parsed) {
      await this.deleteMessage(receiptHandle);
      return;
    }

    const referralKey = parseReferralObjectKey(parsed.key);
    if (!referralKey) {
      console.warn(`[SQS] Ignoring non-referral object key: ${parsed.key}`);
      await this.deleteMessage(receiptHandle);
      return;
    }

    const context: ReferralJobContext = {
      referralId: referralKey.referralId,
      clinicId: referralKey.clinicId,
      bucket: parsed.bucket,
      key: parsed.key,
    };

    try {
      const result = await this.options.onMessage(context);
      if (
        result.kind === 'COMPLETED' ||
        result.kind === 'REJECTED' ||
        result.kind === 'SKIPPED'
      ) {
        await this.deleteMessage(receiptHandle);
      }
    } catch (error) {
      console.error(
        `[SQS] Job failed for referral ${context.referralId}; leaving message for redelivery: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private parseSqsBody(body: string): { bucket: string; key: string } | null {
    try {
      const event = JSON.parse(body) as S3ObjectCreatedEvent;
      const record = event.Records?.find((candidate) =>
        candidate.eventName?.startsWith('ObjectCreated:'),
      );
      if (!record) {
        return null;
      }
      return {
        bucket: record.s3.bucket.name,
        key: record.s3.object.key,
      };
    } catch {
      return null;
    }
  }

  private async deleteMessage(receiptHandle: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteMessageCommand({
          QueueUrl: this.options.queueUrl,
          ReceiptHandle: receiptHandle,
        }),
      );
    } catch (error) {
      console.error(
        `[SQS] DeleteMessage failed (likely already deleted): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  public stop(): void {
    this.stopped = true;
  }
}
