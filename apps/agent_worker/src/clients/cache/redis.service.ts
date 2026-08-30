import Redis from 'ioredis';
import type { CachedExtractionSchema } from '../../types/referral-job.types';

const REFERRAL_KEY_PREFIX = 'referral:';
const REFERRAL_CLAIM_KEY_PREFIX = 'referral-claim:';

export interface ReferralMetadataFromCache {
  fileName: string;
  /** The resolved schema id, when the referral has a custom schema. */
  extractionSchemaId: string | null;
  extractionSchema: CachedExtractionSchema | null;
}

/** The flat `referral:{id}` object written by workbench-api (referral projection + schema). */
interface CachedReferralFromCache {
  fileName: string;
  extractionSchemaId: string | null;
  extractionSchema: CachedExtractionSchema | null;
}

export class RedisService {
  private readonly client: Redis;

  public constructor(redisUrl: string) {
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: 2,
      connectTimeout: 3000,
    });
    this.client.on('error', (error) => {
      console.error(`[Redis] Connection error: ${error.message}`);
    });
  }

  public async getReferralMetadata(
    referralId: string,
  ): Promise<ReferralMetadataFromCache | null> {
    // The API caches the referral as ONE flat JSON object (`CachedReferral`,
    // which is the referral projection plus the resolved schema payload).
    const raw = await this.client.get(`${REFERRAL_KEY_PREFIX}${referralId}`);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as CachedReferralFromCache;
    if (!parsed || !parsed.fileName) {
      return null;
    }
    return {
      fileName: parsed.fileName,
      extractionSchemaId: parsed.extractionSchemaId ?? null,
      extractionSchema: parsed.extractionSchema ?? null,
    };
  }

  /**
   * Atomically claims a referral for this worker via a TTL'd distributed-lock
   * key (`SET NX EX`). `NX` makes concurrent workers racing on the same
   * referral resolve to a single winner; `EX` guarantees a worker that dies
   * mid-extraction releases the claim when the TTL lapses, so the upload
   * message's redelivery can re-drive the job. Must be released on the
   * success AND failure paths for prompt retries (the TTL is only the crash
   * safety net).
   */
  public async tryClaimReferral(
    referralId: string,
    ttlSeconds: number,
    workerId: string,
  ): Promise<boolean> {
    const result = await this.client.set(
      `${REFERRAL_CLAIM_KEY_PREFIX}${referralId}`,
      workerId,
      'EX',
      ttlSeconds,
      'NX',
    );
    return result === 'OK';
  }

  /** Releases the claim so a failed/duplicate delivery can be retried promptly. */
  public async releaseReferralClaim(referralId: string): Promise<void> {
    await this.client.del(`${REFERRAL_CLAIM_KEY_PREFIX}${referralId}`);
  }

  public async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
