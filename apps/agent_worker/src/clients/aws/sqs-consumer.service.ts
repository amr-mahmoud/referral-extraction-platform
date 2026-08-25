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

  public async start(): Promise<void> {
    console.log(`[SQS] Polling ${this.options.queueUrl}...`);
    while (!this.stopped) {
      const response = await this.client.send(
        new ReceiveMessageCommand({
          QueueUrl: this.options.queueUrl,
          MaxNumberOfMessages: this.options.maxConcurrentMessages,
          WaitTimeSeconds: this.options.pollWaitSeconds,
        }),
      );

      const messages = response.Messages ?? [];
      if (messages.length === 0) {
        continue;
      }

      await Promise.allSettled(messages.map((message) => this.handleMessage(message)));
    }
    console.log('[SQS] Poll loop stopped.');
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
      if (result.kind === 'COMPLETED' || result.kind === 'REJECTED' || result.kind === 'SKIPPED') {
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
