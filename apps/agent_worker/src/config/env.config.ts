import 'dotenv/config';
import { z } from 'zod';

const workerEnvSchema = z.object({
  AWS_REGION: z.string().min(1).default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  SQS_QUEUE_URL: z.string().min(1),
  S3_BUCKET_NAME: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().min(1),
  MAX_CONCURRENT_MESSAGES: z.coerce.number().int().positive().default(5),
  POLL_WAIT_SECONDS: z.coerce.number().int().positive().default(15),
  HEALTHCHECK_PORT: z.coerce.number().int().positive().default(8002),
});

export type WorkerEnvConfig = z.infer<typeof workerEnvSchema>;

export function loadWorkerEnvConfig(): WorkerEnvConfig {
  const parsed = workerEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
