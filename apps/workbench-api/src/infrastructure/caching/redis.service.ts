import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';
import {
  CachedExtractionSchema,
  CachingServicePort,
  ReferralCacheEntry,
} from '../../application/ports/caching.port';

const REFERRAL_KEY_PREFIX = 'referral:';

// Fail fast, not fail eventually: ioredis's defaults queue commands and
// retry reconnecting for up to `maxRetriesPerRequest` (20) attempts with
// growing backoff before rejecting — worst case tens of seconds spent
// hanging a request instead of the prompt 500 the fail-closed policy wants.
const MAX_RETRIES_PER_REQUEST = 2;
const CONNECT_TIMEOUT_MS = 3000;

/**
 * `ioredis` auto-connects on construction (unlike `redis` v4, which requires
 * an explicit `connect()`).
 */
@Injectable()
export class RedisService
  implements CachingServicePort, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  public constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl || redisUrl.trim() === '') {
      // Fail loudly at boot — a missing config surfaces here rather than as
      // an opaque 500 on the first upload.
      throw new Error(
        'REDIS_URL must be set to cache referral metadata for the worker',
      );
    }
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: MAX_RETRIES_PER_REQUEST,
      connectTimeout: CONNECT_TIMEOUT_MS,
    });
    // Without a listener, every failed background reconnect attempt prints
    // Node's "Unhandled error event" — route it through the app's own
    // logger instead. The client keeps retrying to reconnect regardless;
    // this only affects how the failure is reported, not the retry policy.
    this.client.on('error', (error) => {
      this.logger.error(`Redis connection error: ${error.message}`);
    });
  }

  public async onModuleInit(): Promise<void> {
    // A best-effort reachability check, logged rather than thrown: Redis is
    // a hard dependency of referral *creation* specifically (the
    // fail-closed policy), not of the whole API — auth and schema
    // management don't touch it, so a Redis outage at boot must not crash
    // every endpoint. The real fail-closed guarantee is enforced per-call in
    // `setManyReferralCaches`.
    try {
      await this.client.ping();
    } catch (error) {
      this.logger.error(
        `Redis is not reachable at startup — referral creation will fail until it is: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  public async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  public async setManyReferralCaches(
    entries: ReferralCacheEntry[],
  ): Promise<void> {
    if (entries.length === 0) {
      return;
    }

    const pipeline = this.client.pipeline();
    for (const entry of entries) {
      pipeline.hset(this.buildKey(entry.referralId), {
        fileName: entry.fileName,
        extractionSchema: entry.extractionSchema
          ? JSON.stringify(entry.extractionSchema)
          : '',
      });
    }

    const results = await pipeline.exec();
    // ioredis never rejects on a per-command failure inside a pipeline — it
    // resolves with one [error, result] tuple per command. Scanning for a
    // non-null error is the only way to actually enforce "fail closed": a
    // silent per-command failure here would leave a referral row with no
    // corresponding cache entry and nothing would ever surface that.
    const failures = (results ?? []).filter(([error]) => error !== null);
    if (failures.length > 0) {
      this.logger.error(
        `Failed to write ${failures.length}/${entries.length} referral cache entries`,
      );
      throw new Error(
        `Failed to write ${failures.length} of ${entries.length} referral cache entries to Redis`,
      );
    }
  }

  public async getReferralCache(
    referralId: string,
  ): Promise<ReferralCacheEntry | null> {
    const raw = await this.client.hgetall(this.buildKey(referralId));
    if (!raw || !raw.fileName) {
      return null;
    }

    return {
      referralId,
      fileName: raw.fileName,
      extractionSchema: raw.extractionSchema
        ? (JSON.parse(raw.extractionSchema) as CachedExtractionSchema)
        : null,
    };
  }

  private buildKey(referralId: string): string {
    return `${REFERRAL_KEY_PREFIX}${referralId}`;
  }
}
