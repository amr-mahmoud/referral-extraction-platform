import Redis from 'ioredis';
import type { CachedExtractionSchema } from '../../types/referral-job.types';

const REFERRAL_KEY_PREFIX = 'referral:';
const CLINIC_REFERRALS_KEY_PREFIX = 'clinic:';
const CLINIC_REFERRALS_KEY_SUFFIX = ':referrals';

export interface ReferralMetadataFromCache {
  fileName: string;
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
    const raw = await this.client.hgetall(`${REFERRAL_KEY_PREFIX}${referralId}`);
    if (!raw || !raw.fileName) {
      return null;
    }
    return {
      fileName: raw.fileName,
      extractionSchema: raw.extractionSchema
        ? (JSON.parse(raw.extractionSchema) as CachedExtractionSchema)
        : null,
    };
  }

  public async indexReferralForClinic(
    clinicId: string,
    referralId: string,
  ): Promise<void> {
    await this.client.sadd(
      `${CLINIC_REFERRALS_KEY_PREFIX}${clinicId}${CLINIC_REFERRALS_KEY_SUFFIX}`,
      referralId,
    );
  }

  public async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
