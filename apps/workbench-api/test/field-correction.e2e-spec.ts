import { resolve } from 'path';
import { config as loadDotEnvFromFile } from 'dotenv';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  ExtractedFieldDto,
  ReferralListItemDto,
} from './../src/interface/http/dto/index.dto';
import { AppModule } from './../src/app.module';
import { AllExceptionFilter } from './../src/infrastructure/filters/all-exception.filter';
import { PrismaService } from './../src/infrastructure/repository/prisma.service';
import {
  CACHING_SERVICE_PORT,
  CachingServicePort,
} from './../src/application/ports/caching.port';

loadDotEnvFromFile({ path: resolve(__dirname, '../../../.env') });

/**
 * Integration: inline extracted-field correction endpoints.
 *
 * Test-safety: this suite writes to Postgres + Redis, so it refuses to run
 * unless DATABASE_URL and REDIS_URL point at a local target. It creates its own
 * throwaway clinics/referrals (unique ids) and deletes only those in afterAll.
 */
const LOCAL_URL =
  /(localhost|127\.0\.0\.1|@postgres|@redis|\/\/postgres|\/\/redis)/;

const AI_BOUNDING_BOX = { xmin: 0.1, ymin: 0.2, xmax: 0.3, ymax: 0.4 };
const SEEDED_PAYLOAD = [
  {
    key: 'patient_name',
    label: 'Patient name',
    value: 'Jane Doe',
    pageNumber: 1,
    boundingBox: AI_BOUNDING_BOX,
  },
  {
    key: 'referring_physician',
    label: 'Referring physician',
    value: 'Dr. Smith',
    pageNumber: 2,
    boundingBox: AI_BOUNDING_BOX,
  },
];

jest.setTimeout(30_000);

describe('Extracted field correction (API integration)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let cache: CachingServicePort;

  const runId = randomUUID().slice(0, 8);
  const createdClinicIds: string[] = [];
  const createdReferralIds: string[] = [];

  let token: string;
  let clinicId: string;
  let foreignToken: string;

  beforeAll(async () => {
    for (const name of ['DATABASE_URL', 'REDIS_URL'] as const) {
      if (!LOCAL_URL.test(process.env[name] ?? '')) {
        throw new Error(
          `Refusing to run state-changing integration tests: ${name} is not a local target`,
        );
      }
    }

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    // Mirror main.ts so validation + error envelope behave as in production.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    cache = app.get<CachingServicePort>(CACHING_SERVICE_PORT);

    const signUp = async (suffix: string) => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          clinicName: `Correction Test ${suffix}`,
          username: `corr_${runId}_${suffix}`,
          password: 'Passw0rd!test1',
        })
        .expect(201);
      createdClinicIds.push(
        (response.body as { clinic: { id: string } }).clinic.id,
      );
      return {
        token: (response.body as { token: string }).token,
        clinicId: (response.body as { clinic: { id: string } }).clinic.id,
      };
    };
    ({ token, clinicId } = await signUp('a'));
    ({ token: foreignToken } = await signUp('b'));
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.referral.deleteMany({
        where: { id: { in: createdReferralIds } },
      });
      await prisma.clinic.deleteMany({
        where: { id: { in: createdClinicIds } },
      });
    }
    if (cache) {
      await cache.deleteReferralsToCache(clinicId, createdReferralIds);
    }
    await app?.close();
  });

  /** Seeds a referral row + a (stale) cache entry for it. */
  async function seedReferral(
    overrides: {
      status?: 'COMPLETED' | 'PROCESSING' | 'FAILED';
      payload?: unknown[];
    } = {},
  ): Promise<string> {
    const id = randomUUID();
    const status = overrides.status ?? 'COMPLETED';
    const payload = overrides.payload ?? SEEDED_PAYLOAD;
    const row = await prisma.referral.create({
      data: {
        id,
        clinicId,
        fileName: `corr-${runId}.pdf`,
        patientName: 'Jane Doe',
        status,
        s3Bucket: 'test-bucket',
        s3Key: `referrals/${clinicId}/${id}.pdf`,
        extractedPayload: payload as never,
      },
    });
    createdReferralIds.push(id);
    await cache.setCachedReferrals([
      {
        id,
        clinicId,
        fileName: row.fileName,
        patientName: row.patientName,
        status,
        extractionSchemaId: null,
        extractionSchemaVersion: null,
        extractionSchemaTitle: null,
        errorMessage: null,
        extractedPayload: payload as never,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        extractionSchema: null,
      },
    ]);
    await cache.addReferralIdsToClinicIndex(clinicId, [id]);
    return id;
  }

  const auth = (t = token) => ({ Authorization: `Bearer ${t}` });
  interface StoredField {
    key: string;
    value: string;
    source?: string;
    aiOriginal?: { value: string } | null;
  }
  const fieldByKey = (body: unknown, key: string): ExtractedFieldDto =>
    (body as ReferralListItemDto).extractedPayload.find(
      (f) => f.key === key,
    ) as ExtractedFieldDto;
  const referralOf = (body: unknown): ReferralListItemDto =>
    body as ReferralListItemDto;
  /** Looks a field up in a stored/cached payload; fails the test if absent. */
  const requireField = (payload: StoredField[] | undefined, key: string) => {
    const field = payload?.find((f) => f.key === key);
    if (!field) throw new Error(`test: field '${key}' missing from payload`);
    return field;
  };

  async function persistedPayload(id: string): Promise<StoredField[]> {
    const row = await prisma.referral.findUniqueOrThrow({ where: { id } });
    return row.extractedPayload as unknown as StoredField[];
  }
  async function cachedPayload(id: string): Promise<StoredField[]> {
    const cached = await cache.getCachedReferral(id);
    return cached?.extractedPayload ?? [];
  }

  describe('PATCH /referrals/:id/fields/:fieldKey', () => {
    it('edits a value, returns the full detail DTO, and persists to Postgres AND Redis', async () => {
      const id = await seedReferral();

      const response = await request(app.getHttpServer())
        .patch(`/referrals/${id}/fields/referring_physician`)
        .set(auth())
        .send({ value: 'Dr. Jones' })
        .expect(200);

      // Full GET /referrals/:id DTO shape
      expect(response.body).toEqual(
        expect.objectContaining({
          id,
          status: 'COMPLETED',
          fileName: `corr-${runId}.pdf`,
          documentUrl: expect.any(String) as string,
          updatedAt: expect.any(String) as string,
        }),
      );
      const field = fieldByKey(response.body, 'referring_physician');
      expect(field).toEqual(
        expect.objectContaining({
          value: 'Dr. Jones',
          source: 'AI',
          pageNumber: 2,
          boundingBox: AI_BOUNDING_BOX,
          aiOriginal: {
            key: 'referring_physician',
            label: 'Referring physician',
            value: 'Dr. Smith',
          },
          correctedAt: expect.any(String) as string,
        }),
      );
      // Untouched field exposes the new provenance props as "unedited AI"
      expect(fieldByKey(response.body, 'patient_name')).toEqual(
        expect.objectContaining({
          source: 'AI',
          aiOriginal: null,
          correctedAt: null,
        }),
      );

      // Postgres
      const stored = requireField(
        await persistedPayload(id),
        'referring_physician',
      );
      expect(stored.value).toBe('Dr. Jones');
      expect(stored.aiOriginal?.value).toBe('Dr. Smith');

      // Redis referral:{id}
      const cached = await cache.getCachedReferral(id);
      const cachedField = requireField(
        await cachedPayload(id),
        'referring_physician',
      );
      expect(cachedField.value).toBe('Dr. Jones');
      expect(cachedField.aiOriginal?.value).toBe('Dr. Smith');
      expect(cached?.updatedAt).toBe(referralOf(response.body).updatedAt);

      // GET reflects it too
      const get = await request(app.getHttpServer())
        .get(`/referrals/${id}`)
        .set(auth())
        .expect(200);
      expect(fieldByKey(get.body, 'referring_physician').value).toBe(
        'Dr. Jones',
      );
    });

    it('renames key + label, keeping page and bounding box', async () => {
      const id = await seedReferral();

      const response = await request(app.getHttpServer())
        .patch(`/referrals/${id}/fields/referring_physician`)
        .set(auth())
        .send({
          key: 'primary_care_physician',
          label: 'Primary care physician',
          value: 'Dr. Smith',
        })
        .expect(200);

      expect(fieldByKey(response.body, 'referring_physician')).toBeUndefined();
      expect(fieldByKey(response.body, 'primary_care_physician')).toEqual(
        expect.objectContaining({
          label: 'Primary care physician',
          pageNumber: 2,
          boundingBox: AI_BOUNDING_BOX,
          aiOriginal: {
            key: 'referring_physician',
            label: 'Referring physician',
            value: 'Dr. Smith',
          },
        }),
      );
      expect((await persistedPayload(id)).map((f) => f.key)).toContain(
        'primary_care_physician',
      );
      expect(
        (await cache.getCachedReferral(id))?.extractedPayload.map((f) => f.key),
      ).toContain('primary_care_physician');
    });

    it('also updates the patientName column when the patient-name field is corrected', async () => {
      const id = await seedReferral();

      const response = await request(app.getHttpServer())
        .patch(`/referrals/${id}/fields/patient_name`)
        .set(auth())
        .send({ value: 'Janet Doe' })
        .expect(200);

      expect(referralOf(response.body).patientName).toBe('Janet Doe');
      expect(
        (await prisma.referral.findUniqueOrThrow({ where: { id } }))
          .patientName,
      ).toBe('Janet Doe');
      expect((await cache.getCachedReferral(id))?.patientName).toBe(
        'Janet Doe',
      );
    });

    it('404 for an unknown field key', async () => {
      const id = await seedReferral();
      await request(app.getHttpServer())
        .patch(`/referrals/${id}/fields/nope`)
        .set(auth())
        .send({ value: 'x' })
        .expect(404);
    });

    it('404 for an unknown referral', async () => {
      await request(app.getHttpServer())
        .patch(`/referrals/${randomUUID()}/fields/patient_name`)
        .set(auth())
        .send({ value: 'x' })
        .expect(404);
    });

    it("404 for another clinic's referral, and nothing changes", async () => {
      const id = await seedReferral();
      await request(app.getHttpServer())
        .patch(`/referrals/${id}/fields/referring_physician`)
        .set(auth(foreignToken))
        .send({ value: 'Hacked' })
        .expect(404);
      expect(
        requireField(await persistedPayload(id), 'referring_physician').value,
      ).toBe('Dr. Smith');
    });

    it('401 without a token', async () => {
      const id = await seedReferral();
      await request(app.getHttpServer())
        .patch(`/referrals/${id}/fields/patient_name`)
        .send({ value: 'x' })
        .expect(401);
    });

    it('409 when the referral is not COMPLETED', async () => {
      const id = await seedReferral({ status: 'PROCESSING', payload: [] });
      await request(app.getHttpServer())
        .patch(`/referrals/${id}/fields/patient_name`)
        .set(auth())
        .send({ value: 'x' })
        .expect(409);
    });

    it('409 when COMPLETED but the extraction is empty', async () => {
      const id = await seedReferral({ status: 'COMPLETED', payload: [] });
      await request(app.getHttpServer())
        .patch(`/referrals/${id}/fields/patient_name`)
        .set(auth())
        .send({ value: 'x' })
        .expect(409);
    });

    it('409 when renaming onto an existing key, and nothing is persisted', async () => {
      const id = await seedReferral();
      await request(app.getHttpServer())
        .patch(`/referrals/${id}/fields/referring_physician`)
        .set(auth())
        .send({ key: 'patient_name', value: 'x' })
        .expect(409);
      const stored = await persistedPayload(id);
      expect(requireField(stored, 'referring_physician').value).toBe(
        'Dr. Smith',
      );
      expect(
        (await cache.getCachedReferral(id))?.extractedPayload.find(
          (f) => f.key === 'referring_physician',
        )?.value,
      ).toBe('Dr. Smith');
    });

    it.each(['Bad Key', 'camelCase', 'has-dash'])(
      '400 for key %j (not lower snake_case)',
      async (badKey) => {
        const id = await seedReferral();
        await request(app.getHttpServer())
          .patch(`/referrals/${id}/fields/referring_physician`)
          .set(auth())
          .send({ key: badKey, value: 'x' })
          .expect(400);
      },
    );

    it('400 for a whitespace-only label', async () => {
      const id = await seedReferral();
      await request(app.getHttpServer())
        .patch(`/referrals/${id}/fields/referring_physician`)
        .set(auth())
        .send({ label: '   ', value: 'x' })
        .expect(400);
    });

    it('400 when value is missing', async () => {
      const id = await seedReferral();
      await request(app.getHttpServer())
        .patch(`/referrals/${id}/fields/referring_physician`)
        .set(auth())
        .send({})
        .expect(400);
    });

    it('accepts an empty-string value', async () => {
      const id = await seedReferral();
      const response = await request(app.getHttpServer())
        .patch(`/referrals/${id}/fields/referring_physician`)
        .set(auth())
        .send({ value: '' })
        .expect(200);
      expect(fieldByKey(response.body, 'referring_physician').value).toBe('');
    });
  });

  describe('POST /referrals/:id/fields', () => {
    it('adds a reviewer field (201), persisted to Postgres AND Redis', async () => {
      const id = await seedReferral();

      const response = await request(app.getHttpServer())
        .post(`/referrals/${id}/fields`)
        .set(auth())
        .send({ key: 'insurance_id', label: 'Insurance ID', value: 'A-123' })
        .expect(201);

      expect(fieldByKey(response.body, 'insurance_id')).toEqual(
        expect.objectContaining({
          label: 'Insurance ID',
          value: 'A-123',
          source: 'REVIEWER',
          pageNumber: null,
          boundingBox: null,
          aiOriginal: null,
        }),
      );
      expect(
        requireField(await persistedPayload(id), 'insurance_id')?.source,
      ).toBe('REVIEWER');
      const cachedField = requireField(await cachedPayload(id), 'insurance_id');
      expect(cachedField.value).toBe('A-123');
      expect(cachedField.source).toBe('REVIEWER');
    });

    it('409 for a duplicate key', async () => {
      const id = await seedReferral();
      await request(app.getHttpServer())
        .post(`/referrals/${id}/fields`)
        .set(auth())
        .send({ key: 'patient_name', label: 'Dup', value: 'x' })
        .expect(409);
    });

    it('400 for a bad key format', async () => {
      const id = await seedReferral();
      await request(app.getHttpServer())
        .post(`/referrals/${id}/fields`)
        .set(auth())
        .send({ key: 'Bad Key', label: 'X', value: 'x' })
        .expect(400);
    });

    it('400 for a whitespace-only label', async () => {
      const id = await seedReferral();
      await request(app.getHttpServer())
        .post(`/referrals/${id}/fields`)
        .set(auth())
        .send({ key: 'good_key', label: '   ', value: 'x' })
        .expect(400);
    });

    it('400 for an empty label', async () => {
      const id = await seedReferral();
      await request(app.getHttpServer())
        .post(`/referrals/${id}/fields`)
        .set(auth())
        .send({ key: 'good_key', label: '', value: 'x' })
        .expect(400);
    });

    it('409 when the referral is not COMPLETED / has an empty extraction', async () => {
      const processing = await seedReferral({
        status: 'PROCESSING',
        payload: [],
      });
      await request(app.getHttpServer())
        .post(`/referrals/${processing}/fields`)
        .set(auth())
        .send({ key: 'k', label: 'K', value: 'v' })
        .expect(409);
      const empty = await seedReferral({ status: 'COMPLETED', payload: [] });
      await request(app.getHttpServer())
        .post(`/referrals/${empty}/fields`)
        .set(auth())
        .send({ key: 'k', label: 'K', value: 'v' })
        .expect(409);
    });

    it("404 for another clinic's referral", async () => {
      const id = await seedReferral();
      await request(app.getHttpServer())
        .post(`/referrals/${id}/fields`)
        .set(auth(foreignToken))
        .send({ key: 'k', label: 'K', value: 'v' })
        .expect(404);
    });
  });

  describe('POST /referrals/:id/fields/:fieldKey/revert', () => {
    it('restores the AI original, clears provenance, persisted to Postgres AND Redis', async () => {
      const id = await seedReferral();
      await request(app.getHttpServer())
        .patch(`/referrals/${id}/fields/referring_physician`)
        .set(auth())
        .send({ key: 'pcp', label: 'PCP', value: 'Dr. Jones' })
        .expect(200);

      const response = await request(app.getHttpServer())
        .post(`/referrals/${id}/fields/pcp/revert`)
        .set(auth())
        .expect(200);

      expect(fieldByKey(response.body, 'pcp')).toBeUndefined();
      expect(fieldByKey(response.body, 'referring_physician')).toEqual(
        expect.objectContaining({
          label: 'Referring physician',
          value: 'Dr. Smith',
          source: 'AI',
          aiOriginal: null,
          correctedAt: null,
          pageNumber: 2,
          boundingBox: AI_BOUNDING_BOX,
        }),
      );
      const stored = requireField(
        await persistedPayload(id),
        'referring_physician',
      );
      expect(stored.value).toBe('Dr. Smith');
      expect(stored.aiOriginal ?? null).toBeNull();
      const cachedField = requireField(
        await cachedPayload(id),
        'referring_physician',
      );
      expect(cachedField.value).toBe('Dr. Smith');
      expect(cachedField.aiOriginal ?? null).toBeNull();
    });

    it('404 for an unknown field', async () => {
      const id = await seedReferral();
      await request(app.getHttpServer())
        .post(`/referrals/${id}/fields/nope/revert`)
        .set(auth())
        .expect(404);
    });

    it("404 for another clinic's referral", async () => {
      const id = await seedReferral();
      await request(app.getHttpServer())
        .post(`/referrals/${id}/fields/patient_name/revert`)
        .set(auth(foreignToken))
        .expect(404);
    });

    it('409 when reverting a field that was never edited', async () => {
      const id = await seedReferral();
      await request(app.getHttpServer())
        .post(`/referrals/${id}/fields/patient_name/revert`)
        .set(auth())
        .expect(409);
    });

    it('409 when the referral is not COMPLETED', async () => {
      const id = await seedReferral({ status: 'FAILED', payload: [] });
      await request(app.getHttpServer())
        .post(`/referrals/${id}/fields/patient_name/revert`)
        .set(auth())
        .expect(409);
    });
  });

  describe('contract cleanup', () => {
    it('the stale whole-payload PATCH /referrals/:id no longer exists', async () => {
      const id = await seedReferral();
      await request(app.getHttpServer())
        .patch(`/referrals/${id}`)
        .set(auth())
        .send({ extractedPayload: [] })
        .expect(404);
    });
  });
});
