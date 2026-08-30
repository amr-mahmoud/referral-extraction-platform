import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import type { ReferralStatusUpdateEvent } from '../../types/referral-job.types';

/**
 * The worker's ONLY write side-effect: publishes extraction results to the
 * workbench-owned SQS_STATUS_UPDATE_URL queue. The workbench API consumes it,
 * applies the idempotent Postgres transition, and the existing LISTEN/NOTIFY
 * path fans the change out to SSE. The worker never writes the database.
 */
export class SqsStatusUpdatePublisher {
  private readonly client: SQSClient;

  public constructor(
    private readonly region: string,
    private readonly queueUrl: string,
  ) {
    this.client = new SQSClient({ region });
  }

  public async publish(event: ReferralStatusUpdateEvent): Promise<void> {
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(event),
      }),
    );
  }
}
