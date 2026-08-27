import Redis from 'ioredis';
import type { CachedExtractionSchema } from '../../types/referral-job.types';

const REFERRAL_KEY_PREFIX = 'referral:';
const CLINIC_REFERRALS_KEY_PREFIX = 'clinic:';
const CLINIC_REFERRALS_KEY_SUFFIX = ':referrals';

// Must match workbench-api's RedisService CLINIC_INDEX_TTL_SECONDS — both
// sides write the same clinic:{id}:referrals SET. If this SADD lands after
// the API's index has expired, a plain SADD with no TTL would silently
// recreate the key containing ONLY this one referral id, and the API's
// cache-aside read would then wrongly trust that partial key as "the whole
// clinic index" until it separately expired on its own. Applying the same
// TTL here bounds that incorrect state to the same self-healing window
// instead of letting it persist indefinitely.
const CLINIC_INDEX_TTL_SECONDS = 10 * 60;

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

  public async indexReferralForClinic(
    clinicId: string,
    referralId: string,
  ): Promise<void> {
    const key = `${CLINIC_REFERRALS_KEY_PREFIX}${clinicId}${CLINIC_REFERRALS_KEY_SUFFIX}`;
    await this.client
      .multi()
      .sadd(key, referralId)
      .expire(key, CLINIC_INDEX_TTL_SECONDS)
      .exec();
  }

  public async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
