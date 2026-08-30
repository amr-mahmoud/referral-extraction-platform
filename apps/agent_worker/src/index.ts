import { randomUUID } from 'crypto';
import { GeminiClient } from './clients/ai/gemini-client.service';
import { S3StorageService } from './clients/aws/s3.service';
import { SqsConsumerService } from './clients/aws/sqs-consumer.service';
import { SqsStatusUpdatePublisher } from './clients/aws/sqs-status-update-publisher.service';
import { RedisService } from './clients/cache/redis.service';
import { loadWorkerEnvConfig } from './config/env.config';
import { ReferralExtractionService } from './extraction/referral-extraction.service';
import { createHealthcheckServer } from './server/healthcheck';

async function main(): Promise<void> {
  const env = loadWorkerEnvConfig();

  const redis = new RedisService(env.REDIS_URL);
  const s3 = new S3StorageService(env.AWS_REGION);
  const gemini = new GeminiClient(env.GEMINI_API_KEY, env.GEMINI_MODEL);
  const statusUpdatePublisher = new SqsStatusUpdatePublisher(
    env.AWS_REGION,
    env.SQS_STATUS_UPDATE_URL,
  );

  const extractionService = new ReferralExtractionService(
    redis,
    s3,
    gemini,
    statusUpdatePublisher,
    env.REFERRAL_CLAIM_TTL_SECONDS,
    `${randomUUID()}`,
  );

  const consumer = new SqsConsumerService({
    region: env.AWS_REGION,
    queueUrl: env.SQS_QUEUE_URL,
    maxConcurrentMessages: env.MAX_CONCURRENT_MESSAGES,
    pollWaitSeconds: env.POLL_WAIT_SECONDS,
    onMessage: (context) => extractionService.processMessage(context),
  });

  const healthcheck = createHealthcheckServer(env.HEALTHCHECK_PORT);

  console.log('[Agent Worker] Background SQS consumer daemon starting...');

  const pollLoopPromise = consumer.start();

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[Agent Worker] Received ${signal}. Gracefully shutting down...`);
    consumer.stop();
    try {
      await pollLoopPromise;
    } catch (error) {
      console.error(
        `[Agent Worker] Poll loop ended with error during shutdown: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    healthcheck.close();
    await redis.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  try {
    await pollLoopPromise;
  } catch (error) {
    console.error(
      `[Agent Worker] Fatal error in poll loop: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    process.exit(1);
  }
}

void main();
