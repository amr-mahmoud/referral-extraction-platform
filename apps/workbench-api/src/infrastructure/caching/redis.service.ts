import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';
import { REPOSITORY_ERROR } from '../../../libs/errors/repository-error-code.enum';
import { CachingServicePort } from '../../application/ports/caching.port';
import { RepositoryException } from '../errors/repository.exception';
import { CachedClinic, CachedReferral } from 'src/application/types';

const REFERRAL_KEY_PREFIX = 'referral:';
const CLINIC_KEY_PREFIX = 'clinic:';
const CLINIC_INDEX_KEY_SUFFIX = ':referrals';

// Self-healing backstop for the clinic index. The index is kept current by
// two writers (referral creation, and the LISTEN/NOTIFY refresh), but a set
// that only ever grows can silently drift if both miss — and a *stale* index
// is invisible to the cache-aside path, which only falls back to Postgres
// when the key is absent entirely. Letting it expire guarantees a full
// rebuild from Postgres at least this often, so drift is bounded.
const CLINIC_INDEX_TTL_SECONDS = 10 * 60000;

// Bounds staleness of the full-clinic cache: the cache is refreshed on every
// schema-resolution miss and after schema creation, but a TTL guarantees it
// self-heals even if a write path is missed.
const CLINIC_CACHE_TTL_SECONDS = 10 * 60;

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
    // `setCachedReferrals`.
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

  public async setCachedReferrals(entries: CachedReferral[]): Promise<void> {
    if (entries.length === 0) {
      return;
    }

    // Read-modify-write of the ONE flat object per referral (`referral:{id}`):
    // creation passes the full CachedReferral, refreshes/backfills pass a fresh
    // projection with `extractionSchema: null` — either way the static schema
    // is carried forward from the existing entry (it is fixed at creation and
    // never changes), so the cached value always matches what the worker and
    // the web app consume.
    const readPipeline = this.client.pipeline();
    for (const entry of entries) {
      readPipeline.get(this.buildKey(entry.id));
    }
    const existingEntries = await readPipeline.exec();

    const writePipeline = this.client.pipeline();
    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index];
      const existingRaw = existingEntries?.[index];
      const existing =
        existingRaw && existingRaw[0] === null
          ? this.parseCachedReferral(existingRaw[1] as string | null)
          : null;
      const merged: CachedReferral = {
        ...entry,
        extractionSchema:
          existing?.extractionSchema ?? entry.extractionSchema ?? null,
      };
      writePipeline.set(this.buildKey(entry.id), JSON.stringify(merged));
    }

    const results = await writePipeline.exec();
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
      throw new RepositoryException(
        REPOSITORY_ERROR.CACHE_WRITE_FAILED,
        `Failed to write ${failures.length} of ${entries.length} referral cache entries to Redis`,
        RedisService.name,
        'setCachedReferrals',
      );
    }
  }

  public async getCachedReferral(
    referralId: string,
  ): Promise<CachedReferral | null> {
    const raw = await this.client.get(this.buildKey(referralId));
    return this.parseCachedReferral(raw);
  }

  public async getManyCachedReferrals(
    referralIds: string[],
  ): Promise<(CachedReferral | null)[]> {
    if (referralIds.length === 0) {
      return [];
    }

    // One pipelined round-trip for the whole page rather than N sequential
    // GETs — the point of the secondary index is that a dashboard load is
    // a single hop, and N round-trips would give that back.
    const pipeline = this.client.pipeline();
    for (const referralId of referralIds) {
      pipeline.get(this.buildKey(referralId));
    }

    const results = await pipeline.exec();
    return referralIds.map((_, index) => {
      const entry = results?.[index];
      if (!entry || entry[0] !== null) {
        // A per-command error is treated as a cache miss, not a hard failure:
        // the caller's Postgres fallback covers it.
        return null;
      }
      return this.parseCachedReferral(entry[1] as string | null);
    });
  }

  public async addReferralIdsToClinicIndex(
    clinicId: string,
    referralIds: string[],
  ): Promise<void> {
    if (referralIds.length === 0) {
      return;
    }
    const key = this.buildClinicIndexKey(clinicId);
    await this.client
      .multi()
      .sadd(key, ...referralIds)
      .expire(key, CLINIC_INDEX_TTL_SECONDS)
      .exec();
  }

  public async getClinicReferralIds(
    clinicId: string,
  ): Promise<string[] | null> {
    const key = this.buildClinicIndexKey(clinicId);
    // EXISTS first: SMEMBERS returns [] both for "empty set" and "no such
    // key", and those mean very different things — the latter must fall
    // through to Postgres, the former must not.
    const keyExists = await this.client.exists(key);
    if (keyExists === 0) {
      return null;
    }
    return this.client.smembers(key);
  }

  public async getFullClinic(clinicId: string): Promise<CachedClinic | null> {
    const raw = await this.client.get(this.buildClinicKey(clinicId));
    return this.parseCachedClinic(raw);
  }

  public async setFullClinic(clinic: CachedClinic): Promise<void> {
    try {
      await this.client.set(
        this.buildClinicKey(clinic.id),
        JSON.stringify(clinic),
        'EX',
        CLINIC_CACHE_TTL_SECONDS,
      );
    } catch (error) {
      throw new RepositoryException(
        REPOSITORY_ERROR.CACHE_WRITE_FAILED,
        error instanceof Error ? error.message : String(error),
        RedisService.name,
        'setFullClinic',
      );
    }
  }

  public async deleteReferralsToCache(
    clinicId: string,
    referralIds: string[],
  ): Promise<void> {
    if (referralIds.length === 0) {
      return;
    }

    const pipeline = this.client.pipeline();
    for (const referralId of referralIds) {
      pipeline.del(this.buildKey(referralId));
    }
    pipeline.srem(this.buildClinicIndexKey(clinicId), ...referralIds);

    const results = await pipeline.exec();
    const failures = (results ?? []).filter(([error]) => error !== null);
    if (failures.length > 0) {
      throw new RepositoryException(
        REPOSITORY_ERROR.CACHE_WRITE_FAILED,
        `Failed to remove ${failures.length} of ${referralIds.length} referral cache entries`,
        RedisService.name,
        'deleteReferralsToCache',
      );
    }
  }

  private parseCachedReferral(raw: string | null): CachedReferral | null {
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as CachedReferral;
    } catch (error) {
      this.logger.error(
        `Discarding unparseable cached referral: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  private parseCachedClinic(raw: string | null): CachedClinic | null {
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as CachedClinic;
    } catch (error) {
      this.logger.error(
        `Discarding unparseable cached clinic: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  private buildKey(referralId: string): string {
    return `${REFERRAL_KEY_PREFIX}${referralId}`;
  }

  private buildClinicKey(clinicId: string): string {
    return `${CLINIC_KEY_PREFIX}${clinicId}`;
  }

  private buildClinicIndexKey(clinicId: string): string {
    return `${CLINIC_KEY_PREFIX}${clinicId}${CLINIC_INDEX_KEY_SUFFIX}`;
  }
}
