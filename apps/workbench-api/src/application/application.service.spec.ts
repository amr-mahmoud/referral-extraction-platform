/* eslint-disable @typescript-eslint/unbound-method -- jest mock function
   references passed to `expect()` are never invoked unbound. */
import { EMPTY, Subject, firstValueFrom } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { ApplicationService } from './application.service';
import { APPLICATION_ERROR } from '../../libs/errors/application-error-code.enum';
import {
  ReferralFileNameError,
  ReferralNotFoundError,
  ReferralValidationError,
} from '../domain/referral/referral.errors';
import { CachingServicePort } from './ports/caching.port';
import { ClinicRepositoryPort } from './ports/clinic-repository.port';
import type {
  ReferralChangedNotification,
  ReferralNotificationPort,
} from './ports/referral-notification.port';
import { ReferralRepositoryPort } from './ports/referral-repository.port';
import { StoragePort } from './ports/storage.port';
import { Clinic } from '../domain/clinic/clinic.aggregate';
import type {
  CachedClinic,
  CachedReferral,
  ReferralStatusUpdateEvent,
} from './types';

const TEST_BUCKET_NAME = 'referral-workbench';

/** Deterministic presigned-GET fake shared by both describe blocks. */
function buildStorageService(): StoragePort {
  return {
    presignReferralUpload: jest.fn((_clinicId, referralId) =>
      Promise.resolve({
        url: `https://s3/${referralId}`,
        expiresAt: new Date(),
      }),
    ),
    presignPut: jest.fn(),
    presignGet: jest.fn(({ key }) =>
      Promise.resolve({
        url: `https://s3/get/${key}`,
        expiresAt: new Date(),
      }),
    ),
    getConfiguredBucketName: jest.fn().mockReturnValue(TEST_BUCKET_NAME),
    buildReferralPdfKey: jest.fn(
      (clinicId: string, referralId: string) =>
        `referrals/${clinicId}/${referralId}.pdf`,
    ),
  };
}

/** The URL `buildStorageService`'s presignGet will emit for a given view. */
function expectedDocumentUrl(view: CachedReferral): string {
  return `https://s3/get/referrals/${view.clinicId}/${view.id}.pdf`;
}

/** No-op notification stream — every describe block but the one testing it directly. */
function buildReferralNotificationService(): ReferralNotificationPort {
  return {
    observeReferralChanges: jest.fn().mockReturnValue(EMPTY),
  };
}

describe('ApplicationService.createNewReferralsWithAttachedPresignedUrls', () => {
  const clinicId = '11111111-1111-1111-1111-111111111111';

  function buildClinic(overrides?: {
    id?: string;
    defaultExtractionSchemaId?: string | null;
  }) {
    return new Clinic({
      id: clinicId,
      clinicName: 'Test Clinic',
      username: 'test_clinic',
      hashedPassword: 'hashed-test-password',
      ...overrides,
    });
  }

  function buildCachedClinic(overrides?: Partial<CachedClinic>): CachedClinic {
    return {
      id: clinicId,
      clinicName: 'Test Clinic',
      username: 'test_clinic',
      passwordHash: 'hashed-test-password',
      defaultExtractionSchemaId: null,
      extractionSchemas: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      ...overrides,
    };
  }

  function buildService(overrides?: {
    clinicRepository?: Partial<ClinicRepositoryPort>;
    referralRepository?: Partial<ReferralRepositoryPort>;
    storageService?: Partial<StoragePort>;
    cachingService?: Partial<CachingServicePort>;
    referralNotificationService?: Partial<ReferralNotificationPort>;
  }) {
    const clinicRepository: ClinicRepositoryPort = {
      findById: jest.fn().mockResolvedValue(buildClinic()),
      findByUsername: jest.fn(),
      save: jest.fn(),
      saveExtractionSchema: jest.fn(),
      findLatestSchemaVersion: jest.fn(),
      listExtractionSchemasByClinic: jest.fn().mockResolvedValue([]),
      ...overrides?.clinicRepository,
    };

    const referralRepository: ReferralRepositoryPort = {
      findReferralById: jest.fn(),
      saveReferral: jest.fn(),
      saveReferrals: jest.fn((referrals) => Promise.resolve(referrals)),
      deleteReferralsByIds: jest.fn().mockResolvedValue(undefined),
      findReferralsByClinicId: jest.fn().mockResolvedValue([]),
      findManyReferralsByIds: jest.fn().mockResolvedValue([]),
      findAllReferrals: jest.fn().mockResolvedValue([]),
      ...overrides?.referralRepository,
    };

    const storageService: StoragePort = {
      ...buildStorageService(),
      ...overrides?.storageService,
    };

    const cachingService: CachingServicePort = {
      setCachedReferrals: jest.fn().mockResolvedValue(undefined),
      getCachedReferral: jest.fn().mockResolvedValue(null),
      getManyCachedReferrals: jest.fn().mockResolvedValue([]),
      addReferralIdsToClinicIndex: jest.fn().mockResolvedValue(undefined),
      getClinicReferralIds: jest.fn().mockResolvedValue(null),
      getFullClinic: jest.fn().mockResolvedValue(null),
      setFullClinic: jest.fn().mockResolvedValue(undefined),
      deleteReferralsToCache: jest.fn().mockResolvedValue(undefined),
      ...overrides?.cachingService,
    };

    const referralNotificationService: ReferralNotificationPort = {
      ...buildReferralNotificationService(),
      ...overrides?.referralNotificationService,
    };

    const service = new ApplicationService(
      clinicRepository,
      referralRepository,
      // encryptionService / tokenService are unused by this method
      {} as never,
      {} as never,
      storageService,
      cachingService,
      referralNotificationService,
    );

    return {
      service,
      clinicRepository,
      referralRepository,
      storageService,
      cachingService,
      referralNotificationService,
    };
  }

  it('creates a batch of referrals with correctly-matched presigned URLs', async () => {
    const { service, referralRepository } = buildService();

    const results = await service.createNewReferralsWithAttachedPresignedUrls({
      clinicId,
      files: [
        { fileName: 'a.pdf' },
        { fileName: 'b.pdf' },
        { fileName: 'c.pdf' },
      ],
    });

    expect(results).toHaveLength(3);
    expect(referralRepository.saveReferrals).toHaveBeenCalledTimes(1);

    results.forEach((result, index) => {
      expect(result.referral.fileName).toBe(['a.pdf', 'b.pdf', 'c.pdf'][index]);
      // The fake presigner embeds the referral id it was called with in the
      // URL — asserting it appears in *this* result's URL proves the
      // presigned URL returned actually belongs to this referral, not just
      // that the arrays are the same length.
      expect(result.upload.url).toBe(`https://s3/${result.referral.id}`);
    });
  });

  it('fails the whole batch and persists nothing when one file name is invalid', async () => {
    const { service, referralRepository } = buildService();

    await expect(
      service.createNewReferralsWithAttachedPresignedUrls({
        clinicId,
        files: [{ fileName: 'a.pdf' }, { fileName: 'not-a-pdf.docx' }],
      }),
    ).rejects.toThrow(ReferralFileNameError);

    expect(referralRepository.saveReferrals).not.toHaveBeenCalled();
  });

  it('resolves the extraction schema exactly once regardless of batch size', async () => {
    const { service, clinicRepository } = buildService();

    await service.createNewReferralsWithAttachedPresignedUrls({
      clinicId,
      files: [
        { fileName: 'a.pdf' },
        { fileName: 'b.pdf' },
        { fileName: 'c.pdf' },
        { fileName: 'd.pdf' },
      ],
    });

    expect(clinicRepository.findById).toHaveBeenCalledTimes(1);
  });

  it('rejects an empty file list before any repository, storage, or cache call', async () => {
    const { service, referralRepository, storageService, cachingService } =
      buildService();

    await expect(
      service.createNewReferralsWithAttachedPresignedUrls({
        clinicId,
        files: [],
      }),
    ).rejects.toThrow(ReferralValidationError);

    expect(referralRepository.saveReferrals).not.toHaveBeenCalled();
    expect(storageService.presignReferralUpload).not.toHaveBeenCalled();
    expect(cachingService.setCachedReferrals).not.toHaveBeenCalled();
  });

  it('caches one entry per referral, matching referralId, fileName, and the resolved schema', async () => {
    const schemaId = '22222222-2222-2222-2222-222222222222';
    const { service, cachingService, clinicRepository } = buildService({
      clinicRepository: {
        listExtractionSchemasByClinic: jest.fn().mockResolvedValue([
          {
            id: schemaId,
            version: 2,
            title: 'Q3 Insurance Forms',
            clinicId,
            schemaDefinition: [
              {
                key: 'patient_name',
                label: 'Patient Name',
                description: 'Full name',
              },
            ],
          },
        ]),
      },
    });

    const results = await service.createNewReferralsWithAttachedPresignedUrls({
      clinicId,
      files: [{ fileName: 'a.pdf' }, { fileName: 'b.pdf' }],
      extractionSchemaId: schemaId,
    });

    expect(clinicRepository.listExtractionSchemasByClinic).toHaveBeenCalledWith(
      clinicId,
    );
    expect(cachingService.setCachedReferrals).toHaveBeenCalledTimes(1);

    const entries = jest.mocked(cachingService.setCachedReferrals).mock
      .calls[0][0];
    expect(entries).toHaveLength(2);
    entries.forEach((entry, index) => {
      expect(entry.id).toBe(results[index].referral.id);
      expect(entry.fileName).toBe(results[index].referral.fileName);
    });
    expect(entries[0].extractionSchema).toEqual({
      id: schemaId,
      clinicId,
      version: 2,
      title: 'Q3 Insurance Forms',
      schemaDefinition: [
        {
          key: 'patient_name',
          label: 'Patient Name',
          description: 'Full name',
        },
      ],
    });
    expect(entries[0]).toMatchObject({
      id: results[0].referral.id,
      fileName: 'a.pdf',
      status: 'PENDING',
      extractionSchemaId: schemaId,
      extractionSchemaTitle: 'Q3 Insurance Forms',
      extractionSchemaVersion: 2,
    });
  });

  it('rolls back the persisted rows when the cache write fails (compensating event)', async () => {
    const { service, referralRepository, cachingService } = buildService({
      cachingService: {
        setCachedReferrals: jest
          .fn()
          .mockRejectedValue(new Error('ECONNREFUSED')),
      },
    });

    await expect(
      service.createNewReferralsWithAttachedPresignedUrls({
        clinicId,
        files: [{ fileName: 'a.pdf' }],
      }),
    ).rejects.toMatchObject({
      errorCode: APPLICATION_ERROR.GENERAL_APPLICATION_ERROR,
      details: 'ECONNREFUSED',
      methodSrc: 'createNewReferralsWithAttachedPresignedUrls',
    });

    // The rows were persisted, but the failed cache write triggers the
    // compensating rollback — the request is all-or-nothing, so the
    // just-inserted referral is deleted to restore the pre-request state.
    expect(referralRepository.saveReferrals).toHaveBeenCalledTimes(1);
    expect(referralRepository.deleteReferralsByIds).toHaveBeenCalledTimes(1);
    expect(cachingService.deleteReferralsToCache).toHaveBeenCalledTimes(1);
  });

  it('removes the cache entries when persistence fails (compensating event)', async () => {
    const { service, referralRepository, cachingService } = buildService({
      referralRepository: {
        saveReferrals: jest.fn().mockRejectedValue(new Error('DB_DOWN')),
      },
    });

    await expect(
      service.createNewReferralsWithAttachedPresignedUrls({
        clinicId,
        files: [{ fileName: 'a.pdf' }],
      }),
    ).rejects.toMatchObject({
      errorCode: APPLICATION_ERROR.GENERAL_APPLICATION_ERROR,
      details: 'DB_DOWN',
      methodSrc: 'createNewReferralsWithAttachedPresignedUrls',
    });

    // Persistence never committed, so no rows to delete — only the cache
    // entries that the parallel write may have landed are rolled back.
    expect(referralRepository.saveReferrals).toHaveBeenCalledTimes(1);
    expect(referralRepository.deleteReferralsByIds).not.toHaveBeenCalled();
    expect(cachingService.deleteReferralsToCache).toHaveBeenCalledTimes(1);
  });

  it('resolves the extraction schema fully from the cached clinic, with zero repository calls', async () => {
    const schemaId = '22222222-2222-2222-2222-222222222222';
    const { service, cachingService, clinicRepository } = buildService({
      cachingService: {
        getFullClinic: jest.fn().mockResolvedValue(
          buildCachedClinic({
            defaultExtractionSchemaId: schemaId,
            extractionSchemas: [
              {
                id: schemaId,
                clinicId,
                version: 1,
                title: 'Cached Schema',
                schemaDefinition: [
                  {
                    key: 'policy',
                    label: 'Policy',
                    description: 'Policy number',
                  },
                ],
              },
            ],
          }),
        ),
      },
    });

    await service.createNewReferralsWithAttachedPresignedUrls({
      clinicId,
      files: [{ fileName: 'a.pdf' }],
      extractionSchemaId: schemaId,
    });

    expect(cachingService.getFullClinic).toHaveBeenCalledWith(clinicId);
    expect(clinicRepository.findById).not.toHaveBeenCalled();
  });

  it('falls back to the repository on a cache miss and backfills the clinic cache', async () => {
    const schemaId = '22222222-2222-2222-2222-222222222222';
    const { service, cachingService, clinicRepository } = buildService({
      clinicRepository: {
        findById: jest
          .fn()
          .mockResolvedValue(
            buildClinic({ defaultExtractionSchemaId: schemaId }),
          ),
        listExtractionSchemasByClinic: jest.fn().mockResolvedValue([
          {
            id: schemaId,
            clinicId,
            version: 1,
            title: 'DB Schema',
            schemaDefinition: [
              { key: 'policy', label: 'Policy', description: 'Policy number' },
            ],
          },
        ]),
      },
    });

    await service.createNewReferralsWithAttachedPresignedUrls({
      clinicId,
      files: [{ fileName: 'a.pdf' }],
      extractionSchemaId: schemaId,
    });

    expect(clinicRepository.findById).toHaveBeenCalledWith(clinicId);

    const cachedClinic = jest.mocked(cachingService.setFullClinic).mock
      .calls[0][0];
    expect(cachedClinic).toMatchObject({
      id: clinicId,
      defaultExtractionSchemaId: schemaId,
    });
    expect(cachedClinic.extractionSchemas).toHaveLength(1);
    expect(cachedClinic.extractionSchemas[0]).toMatchObject({
      id: schemaId,
      title: 'DB Schema',
    });
  });
});

describe('ApplicationService.listClinicReferrals', () => {
  const clinicId = '11111111-1111-1111-1111-111111111111';

  function buildService(overrides?: {
    referralRepository?: Partial<ReferralRepositoryPort>;
    cachingService?: Partial<CachingServicePort>;
    storageService?: Partial<StoragePort>;
  }) {
    const clinicRepository: ClinicRepositoryPort = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
      saveExtractionSchema: jest.fn(),
      findLatestSchemaVersion: jest.fn(),
      listExtractionSchemasByClinic: jest.fn(),
    };

    const referralRepository: ReferralRepositoryPort = {
      findReferralById: jest.fn(),
      saveReferral: jest.fn(),
      saveReferrals: jest.fn(),
      deleteReferralsByIds: jest.fn().mockResolvedValue(undefined),
      findReferralsByClinicId: jest.fn().mockResolvedValue([]),
      findManyReferralsByIds: jest.fn().mockResolvedValue([]),
      findAllReferrals: jest.fn().mockResolvedValue([]),
      ...overrides?.referralRepository,
    };

    const cachingService: CachingServicePort = {
      setCachedReferrals: jest.fn(),
      getCachedReferral: jest.fn().mockResolvedValue(null),
      getManyCachedReferrals: jest.fn().mockResolvedValue([]),
      addReferralIdsToClinicIndex: jest.fn().mockResolvedValue(undefined),
      getClinicReferralIds: jest.fn().mockResolvedValue(null),
      getFullClinic: jest.fn().mockResolvedValue(null),
      setFullClinic: jest.fn().mockResolvedValue(undefined),
      deleteReferralsToCache: jest.fn().mockResolvedValue(undefined),
      ...overrides?.cachingService,
    };

    const service = new ApplicationService(
      clinicRepository,
      referralRepository,
      {} as never,
      {} as never,
      { ...buildStorageService(), ...overrides?.storageService },
      cachingService,
      buildReferralNotificationService(),
    );

    return { service, referralRepository, cachingService };
  }

  function buildView(overrides?: Partial<CachedReferral>): CachedReferral {
    return {
      id: 'referral-1',
      clinicId: clinicId,
      fileName: 'a.pdf',
      patientName: null,
      status: 'PENDING',
      extractionSchemaId: null,
      extractionSchemaVersion: null,
      extractionSchemaTitle: null,
      errorMessage: null,
      extractedPayload: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      extractionSchema: null,
      ...overrides,
    };
  }

  /** The served shape: the cached view plus a freshly-attached documentUrl. */
  function buildServedView(
    view: CachedReferral,
  ): CachedReferral & { documentUrl: string } {
    return { ...view, documentUrl: expectedDocumentUrl(view) };
  }

  it('serves entirely from Redis on a full cache hit, without touching Postgres', async () => {
    const view = buildView();
    const { service, referralRepository } = buildService({
      cachingService: {
        getClinicReferralIds: jest.fn().mockResolvedValue([view.id]),
        getManyCachedReferrals: jest.fn().mockResolvedValue([view]),
      },
    });

    const results = await service.listClinicReferrals(clinicId);

    expect(results).toEqual([buildServedView(view)]);
    expect(referralRepository.findReferralsByClinicId).not.toHaveBeenCalled();
    expect(referralRepository.findManyReferralsByIds).not.toHaveBeenCalled();
  });

  it('rebuilds from Postgres and backfills Redis when the clinic index key is entirely absent', async () => {
    const view = buildView();
    const { service, cachingService } = buildService({
      cachingService: {
        getClinicReferralIds: jest.fn().mockResolvedValue(null),
      },
      referralRepository: {
        findReferralsByClinicId: jest.fn().mockResolvedValue([view]),
      },
    });

    const results = await service.listClinicReferrals(clinicId);

    expect(results).toEqual([buildServedView(view)]);
    expect(cachingService.setCachedReferrals).toHaveBeenCalledWith([view]);
    expect(cachingService.addReferralIdsToClinicIndex).toHaveBeenCalledWith(
      clinicId,
      [view.id],
    );
  });

  it('returns an empty list without touching Postgres when the index exists but is empty', async () => {
    const { service, referralRepository } = buildService({
      cachingService: { getClinicReferralIds: jest.fn().mockResolvedValue([]) },
    });

    const results = await service.listClinicReferrals(clinicId);

    expect(results).toEqual([]);
    expect(referralRepository.findReferralsByClinicId).not.toHaveBeenCalled();
  });

  it('backfills only the ids that missed the cache on a partial miss', async () => {
    const cachedView = buildView({ id: 'referral-cached' });
    const missingView = buildView({ id: 'referral-missing' });
    const { service, referralRepository, cachingService } = buildService({
      cachingService: {
        getClinicReferralIds: jest
          .fn()
          .mockResolvedValue([cachedView.id, missingView.id]),
        getManyCachedReferrals: jest.fn().mockResolvedValue([cachedView, null]),
      },
      referralRepository: {
        findManyReferralsByIds: jest.fn().mockResolvedValue([missingView]),
      },
    });

    const results = await service.listClinicReferrals(clinicId);

    expect(referralRepository.findManyReferralsByIds).toHaveBeenCalledWith([
      missingView.id,
    ]);
    expect(cachingService.setCachedReferrals).toHaveBeenCalledWith([
      missingView,
    ]);
    expect(results.map((view) => view.id).sort()).toEqual(
      [cachedView.id, missingView.id].sort(),
    );
  });

  it('sorts results newest-first regardless of the (unordered) SET iteration order', async () => {
    const older = buildView({
      id: 'older',
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    const newer = buildView({
      id: 'newer',
      createdAt: '2026-01-02T00:00:00.000Z',
    });
    const { service } = buildService({
      cachingService: {
        getClinicReferralIds: jest.fn().mockResolvedValue([older.id, newer.id]),
        getManyCachedReferrals: jest.fn().mockResolvedValue([older, newer]),
      },
    });

    const results = await service.listClinicReferrals(clinicId);

    expect(results.map((view) => view.id)).toEqual([newer.id, older.id]);
  });

  it('falls back to Postgres and does not throw when Redis itself errors', async () => {
    const view = buildView();
    const { service } = buildService({
      cachingService: {
        getClinicReferralIds: jest
          .fn()
          .mockRejectedValue(new Error('ECONNREFUSED')),
      },
      referralRepository: {
        findReferralsByClinicId: jest.fn().mockResolvedValue([view]),
      },
    });

    const results = await service.listClinicReferrals(clinicId);

    expect(results).toEqual([buildServedView(view)]);
  });
});

describe('ApplicationService.getClinicReferral', () => {
  const clinicId = '11111111-1111-1111-1111-111111111111';
  const otherClinicId = '99999999-9999-9999-9999-999999999999';

  function buildService(overrides?: {
    referralRepository?: Partial<ReferralRepositoryPort>;
    cachingService?: Partial<CachingServicePort>;
    storageService?: Partial<StoragePort>;
  }) {
    const clinicRepository: ClinicRepositoryPort = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
      saveExtractionSchema: jest.fn(),
      findLatestSchemaVersion: jest.fn(),
      listExtractionSchemasByClinic: jest.fn(),
    };

    const referralRepository: ReferralRepositoryPort = {
      findReferralById: jest.fn(),
      saveReferral: jest.fn(),
      saveReferrals: jest.fn(),
      deleteReferralsByIds: jest.fn().mockResolvedValue(undefined),
      findReferralsByClinicId: jest.fn().mockResolvedValue([]),
      findManyReferralsByIds: jest.fn().mockResolvedValue([]),
      findAllReferrals: jest.fn().mockResolvedValue([]),
      ...overrides?.referralRepository,
    };

    const cachingService: CachingServicePort = {
      setCachedReferrals: jest.fn(),
      getCachedReferral: jest.fn().mockResolvedValue(null),
      getManyCachedReferrals: jest.fn().mockResolvedValue([]),
      addReferralIdsToClinicIndex: jest.fn().mockResolvedValue(undefined),
      getClinicReferralIds: jest.fn().mockResolvedValue(null),
      getFullClinic: jest.fn().mockResolvedValue(null),
      setFullClinic: jest.fn().mockResolvedValue(undefined),
      deleteReferralsToCache: jest.fn().mockResolvedValue(undefined),
      ...overrides?.cachingService,
    };

    const service = new ApplicationService(
      clinicRepository,
      referralRepository,
      {} as never,
      {} as never,
      { ...buildStorageService(), ...overrides?.storageService },
      cachingService,
      buildReferralNotificationService(),
    );

    return { service, referralRepository, cachingService };
  }

  function buildView(overrides?: Partial<CachedReferral>): CachedReferral {
    return {
      id: 'referral-1',
      clinicId: clinicId,
      fileName: 'a.pdf',
      patientName: null,
      status: 'COMPLETED',
      extractionSchemaId: null,
      extractionSchemaVersion: null,
      extractionSchemaTitle: null,
      errorMessage: null,
      extractedPayload: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      extractionSchema: null,
      ...overrides,
    };
  }

  function buildServedView(
    view: CachedReferral,
  ): CachedReferral & { documentUrl: string } {
    return { ...view, documentUrl: expectedDocumentUrl(view) };
  }

  it('serves from Redis on a cache hit, without touching Postgres', async () => {
    const view = buildView();
    const { service, referralRepository } = buildService({
      cachingService: { getCachedReferral: jest.fn().mockResolvedValue(view) },
    });

    const result = await service.getClinicReferral(clinicId, view.id);

    expect(result).toEqual(buildServedView(view));
    expect(referralRepository.findReferralById).not.toHaveBeenCalled();
  });

  it('falls back to Postgres and backfills Redis on a cache miss', async () => {
    const view = buildView();
    const { service, cachingService } = buildService({
      cachingService: { getCachedReferral: jest.fn().mockResolvedValue(null) },
      referralRepository: {
        findReferralById: jest.fn().mockResolvedValue(view),
      },
    });

    const result = await service.getClinicReferral(clinicId, view.id);

    expect(result).toEqual(buildServedView(view));
    expect(cachingService.setCachedReferrals).toHaveBeenCalledWith([view]);
  });

  it('treats a cache hit for a different clinic as a miss, not a leak, and falls through to Postgres', async () => {
    const foreignView = buildView({ clinicId: otherClinicId });
    const ownView = buildView();
    const { service, referralRepository } = buildService({
      cachingService: {
        getCachedReferral: jest.fn().mockResolvedValue(foreignView),
      },
      referralRepository: {
        findReferralById: jest.fn().mockResolvedValue(ownView),
      },
    });

    const result = await service.getClinicReferral(clinicId, ownView.id);

    expect(result).toEqual(buildServedView(ownView));
    expect(referralRepository.findReferralById).toHaveBeenCalledWith(
      ownView.id,
    );
  });

  it('throws ReferralNotFoundError when the id belongs to another clinic in Postgres too', async () => {
    const foreignView = buildView({ clinicId: otherClinicId });
    const { service } = buildService({
      referralRepository: {
        findReferralById: jest.fn().mockResolvedValue(foreignView),
      },
    });

    await expect(
      service.getClinicReferral(clinicId, foreignView.id),
    ).rejects.toThrow(ReferralNotFoundError);
  });

  it('throws ReferralNotFoundError when the id does not exist anywhere', async () => {
    const { service } = buildService();

    await expect(
      service.getClinicReferral(clinicId, 'does-not-exist'),
    ).rejects.toThrow(ReferralNotFoundError);
  });

  it('falls back to Postgres and does not throw when Redis itself errors', async () => {
    const view = buildView();
    const { service } = buildService({
      cachingService: {
        getCachedReferral: jest
          .fn()
          .mockRejectedValue(new Error('ECONNREFUSED')),
      },
      referralRepository: {
        findReferralById: jest.fn().mockResolvedValue(view),
      },
    });

    const result = await service.getClinicReferral(clinicId, view.id);

    expect(result).toEqual(buildServedView(view));
  });
});

describe('ApplicationService.observeClinicReferralChanges', () => {
  const clinicId = '11111111-1111-1111-1111-111111111111';
  const otherClinicId = '99999999-9999-9999-9999-999999999999';

  function buildService(overrides?: {
    referralRepository?: Partial<ReferralRepositoryPort>;
    cachingService?: Partial<CachingServicePort>;
    storageService?: Partial<StoragePort>;
  }) {
    const clinicRepository: ClinicRepositoryPort = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
      saveExtractionSchema: jest.fn(),
      findLatestSchemaVersion: jest.fn(),
      listExtractionSchemasByClinic: jest.fn(),
    };

    const referralRepository: ReferralRepositoryPort = {
      findReferralById: jest.fn(),
      saveReferral: jest.fn(),
      saveReferrals: jest.fn(),
      deleteReferralsByIds: jest.fn().mockResolvedValue(undefined),
      findReferralsByClinicId: jest.fn().mockResolvedValue([]),
      findManyReferralsByIds: jest.fn().mockResolvedValue([]),
      findAllReferrals: jest.fn().mockResolvedValue([]),
      ...overrides?.referralRepository,
    };

    const cachingService: CachingServicePort = {
      setCachedReferrals: jest.fn().mockResolvedValue(undefined),
      getCachedReferral: jest.fn().mockResolvedValue(null),
      getManyCachedReferrals: jest.fn().mockResolvedValue([]),
      addReferralIdsToClinicIndex: jest.fn().mockResolvedValue(undefined),
      getClinicReferralIds: jest.fn().mockResolvedValue(null),
      getFullClinic: jest.fn().mockResolvedValue(null),
      setFullClinic: jest.fn().mockResolvedValue(undefined),
      deleteReferralsToCache: jest.fn().mockResolvedValue(undefined),
      ...overrides?.cachingService,
    };

    const notifications$ = new Subject<ReferralChangedNotification>();
    const referralNotificationService: ReferralNotificationPort = {
      observeReferralChanges: jest.fn().mockReturnValue(notifications$),
    };

    const service = new ApplicationService(
      clinicRepository,
      referralRepository,
      {} as never,
      {} as never,
      { ...buildStorageService(), ...overrides?.storageService },
      cachingService,
      referralNotificationService,
    );

    return { service, referralRepository, cachingService, notifications$ };
  }

  function buildView(overrides?: Partial<CachedReferral>): CachedReferral {
    return {
      id: 'referral-1',
      clinicId: clinicId,
      fileName: 'a.pdf',
      patientName: null,
      status: 'COMPLETED',
      extractionSchemaId: null,
      extractionSchemaVersion: null,
      extractionSchemaTitle: null,
      errorMessage: null,
      extractedPayload: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      extractionSchema: null,
      ...overrides,
    };
  }

  function buildServedView(
    view: CachedReferral,
  ): CachedReferral & { documentUrl: string } {
    return { ...view, documentUrl: expectedDocumentUrl(view) };
  }

  it('drops a notification for a different clinic before ever reading the referral', async () => {
    const view = buildView();
    const { service, referralRepository, notifications$ } = buildService({
      referralRepository: {
        findReferralById: jest.fn().mockResolvedValue(view),
      },
    });

    const results$ = firstValueFrom(
      service.observeClinicReferralChanges(clinicId).pipe(toArray()),
    );

    notifications$.next({
      referralId: view.id,
      clinicId: otherClinicId,
      status: 'PROCESSING',
    });
    notifications$.complete();

    expect(await results$).toEqual([]);
    expect(referralRepository.findReferralById).not.toHaveBeenCalled();
  });

  it('drops a notification whose referral no longer exists rather than emitting null', async () => {
    const { service, notifications$ } = buildService({
      referralRepository: {
        findReferralById: jest.fn().mockResolvedValue(null),
      },
    });

    const results$ = firstValueFrom(
      service.observeClinicReferralChanges(clinicId).pipe(toArray()),
    );

    notifications$.next({
      referralId: 'does-not-exist',
      clinicId,
      status: 'PROCESSING',
    });
    notifications$.complete();

    expect(await results$).toEqual([]);
  });

  it('emits the refreshed, served referral for a matching notification', async () => {
    const view = buildView({ status: 'COMPLETED' });
    const { service, cachingService, notifications$ } = buildService({
      referralRepository: {
        findReferralById: jest.fn().mockResolvedValue(view),
      },
    });

    const results$ = firstValueFrom(
      service.observeClinicReferralChanges(clinicId).pipe(toArray()),
    );

    notifications$.next({
      referralId: view.id,
      clinicId,
      status: 'COMPLETED',
    });
    notifications$.complete();

    expect(await results$).toEqual([buildServedView(view)]);

    expect(cachingService.setCachedReferrals).toHaveBeenCalledWith([view]);
    expect(cachingService.addReferralIdsToClinicIndex).not.toHaveBeenCalled();
  });

  it('filters foreign-clinic notifications out of a mixed stream without disrupting the ones that match', async () => {
    const ownView = buildView({ id: 'own-referral' });
    const foreignView = buildView({
      id: 'foreign-referral',
      clinicId: otherClinicId,
    });
    const { service, notifications$ } = buildService({
      referralRepository: {
        findReferralById: jest.fn((id: string) =>
          Promise.resolve(id === ownView.id ? ownView : foreignView),
        ),
      },
    });

    const results$ = firstValueFrom(
      service.observeClinicReferralChanges(clinicId).pipe(toArray()),
    );

    notifications$.next({
      referralId: foreignView.id,
      clinicId: otherClinicId,
      status: 'PROCESSING',
    });
    notifications$.next({
      referralId: ownView.id,
      clinicId,
      status: 'PROCESSING',
    });
    notifications$.complete();

    expect(await results$).toEqual([buildServedView(ownView)]);
  });
});

describe('ApplicationService.applyReferralStatusUpdate', () => {
  const clinicId = '11111111-1111-1111-1111-111111111111';
  const otherClinicId = '99999999-9999-9999-9999-999999999999';

  function buildService(overrides?: {
    referralRepository?: Partial<ReferralRepositoryPort>;
  }) {
    const clinicRepository: ClinicRepositoryPort = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
      saveExtractionSchema: jest.fn(),
      findLatestSchemaVersion: jest.fn(),
      listExtractionSchemasByClinic: jest.fn(),
    };

    const referralRepository: ReferralRepositoryPort = {
      findReferralById: jest.fn().mockResolvedValue(buildView()),
      saveReferral: jest.fn(),
      saveReferrals: jest.fn(),
      deleteReferralsByIds: jest.fn().mockResolvedValue(undefined),
      findReferralsByClinicId: jest.fn().mockResolvedValue([]),
      findManyReferralsByIds: jest.fn().mockResolvedValue([]),
      findAllReferrals: jest.fn().mockResolvedValue([]),
      ...overrides?.referralRepository,
    };

    const cachingService: CachingServicePort = {
      setCachedReferrals: jest.fn().mockResolvedValue(undefined),
      getCachedReferral: jest.fn().mockResolvedValue(null),
      getManyCachedReferrals: jest.fn().mockResolvedValue([]),
      addReferralIdsToClinicIndex: jest.fn().mockResolvedValue(undefined),
      getClinicReferralIds: jest.fn().mockResolvedValue(null),
      getFullClinic: jest.fn().mockResolvedValue(null),
      setFullClinic: jest.fn().mockResolvedValue(undefined),
      deleteReferralsToCache: jest.fn().mockResolvedValue(undefined),
    };

    const service = new ApplicationService(
      clinicRepository,
      referralRepository,
      {} as never,
      {} as never,
      buildStorageService(),
      cachingService,
      buildReferralNotificationService(),
    );

    return { service, referralRepository, cachingService };
  }

  function buildView(overrides?: Partial<CachedReferral>): CachedReferral {
    return {
      id: 'referral-1',
      clinicId: clinicId,
      fileName: 'a.pdf',
      patientName: null,
      status: 'PENDING',
      extractionSchemaId: null,
      extractionSchemaVersion: null,
      extractionSchemaTitle: null,
      errorMessage: null,
      extractedPayload: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      extractionSchema: null,
      ...overrides,
    };
  }

  function buildEvent(overrides?: {
    status?: 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'FAILED';
  }): ReferralStatusUpdateEvent {
    return {
      referralId: 'referral-1',
      clinicId,
      status: 'COMPLETED',
      extractedPayload: [],
      patientName: null,
      extractionSchemaId: null,
      errorMessage: null,
      extractedAt: '2026-01-01T00:00:00.000Z',
      ...overrides,
    };
  }

  it('rehydrates the aggregate, mutates via updateStatus, persists, and refreshes the cache', async () => {
    const event = buildEvent();
    const { service, referralRepository, cachingService } = buildService();

    await service.applyReferralStatusUpdate(event);

    expect(referralRepository.saveReferral).toHaveBeenCalledTimes(1);
    const saved = jest.mocked(referralRepository.saveReferral).mock.calls[0][0];
    expect(saved.id).toBe('referral-1');
    expect(saved.clinicId).toBe(clinicId);
    expect(saved.status.value).toBe('COMPLETED');
    // The LISTEN-driven refresh is complemented by an eager cache write here;
    // the clinic index is deliberately left untouched (partial-index safety).
    expect(cachingService.setCachedReferrals).toHaveBeenCalled();
    expect(cachingService.addReferralIdsToClinicIndex).not.toHaveBeenCalled();
  });

  it('serves the aggregate from the cache and skips the repository fetch on a hit', async () => {
    const { service, referralRepository, cachingService } = buildService({
      // If the initial fetch went to the repository it would resolve null and
      // the use case would no-op — so a save proves the cache was the source.
      referralRepository: {
        findReferralById: jest.fn().mockResolvedValue(null),
      },
    });

    jest
      .mocked(cachingService.getCachedReferral)
      .mockResolvedValue(buildView({ status: 'PENDING' }));

    await expect(
      service.applyReferralStatusUpdate(buildEvent()),
    ).resolves.toBeUndefined();

    expect(referralRepository.saveReferral).toHaveBeenCalledTimes(1);
  });

  it('falls back to the repository when the cache misses', async () => {
    const { service, referralRepository } = buildService();
    jest
      .mocked(referralRepository.findReferralById)
      .mockResolvedValue(buildView({ status: 'PENDING' }));

    await service.applyReferralStatusUpdate(buildEvent());

    expect(referralRepository.findReferralById).toHaveBeenCalledWith(
      'referral-1',
    );
  });

  it('does NOT ack an unknown referral so SQS retries it after the visibility timeout', async () => {
    const { service, referralRepository } = buildService({
      referralRepository: {
        findReferralById: jest.fn().mockResolvedValue(null),
      },
    });

    await expect(
      service.applyReferralStatusUpdate(buildEvent({ status: 'FAILED' })),
    ).rejects.toThrow(ReferralNotFoundError);

    expect(referralRepository.saveReferral).not.toHaveBeenCalled();
  });

  it('rejects an event for a referral owned by another clinic', async () => {
    const { service, referralRepository } = buildService({
      referralRepository: {
        findReferralById: jest
          .fn()
          .mockResolvedValue(buildView({ clinicId: otherClinicId })),
      },
    });

    await expect(
      service.applyReferralStatusUpdate(buildEvent()),
    ).rejects.toThrow(ReferralNotFoundError);

    expect(referralRepository.saveReferral).not.toHaveBeenCalled();
  });

  it('acks a redelivered COMPLETED event as an idempotent no-op', async () => {
    const { service, referralRepository } = buildService({
      referralRepository: {
        findReferralById: jest
          .fn()
          .mockResolvedValue(buildView({ status: 'COMPLETED' })),
      },
    });

    await expect(
      service.applyReferralStatusUpdate(buildEvent({ status: 'COMPLETED' })),
    ).resolves.toBeUndefined();

    expect(referralRepository.saveReferral).not.toHaveBeenCalled();
  });

  it('moves a PENDING referral to PROCESSING on a PROCESSING event', async () => {
    const { service, referralRepository } = buildService({
      referralRepository: {
        findReferralById: jest
          .fn()
          .mockResolvedValue(buildView({ status: 'PENDING' })),
      },
    });

    await service.applyReferralStatusUpdate(
      buildEvent({ status: 'PROCESSING' }),
    );

    expect(referralRepository.saveReferral).toHaveBeenCalledTimes(1);
    const saved = jest.mocked(referralRepository.saveReferral).mock.calls[0][0];
    expect(saved.status.value).toBe('PROCESSING');
  });

  it('acks a redelivered PROCESSING event on an already-PROCESSING referral', async () => {
    const { service, referralRepository } = buildService({
      referralRepository: {
        findReferralById: jest
          .fn()
          .mockResolvedValue(buildView({ status: 'PROCESSING' })),
      },
    });

    await expect(
      service.applyReferralStatusUpdate(buildEvent({ status: 'PROCESSING' })),
    ).resolves.toBeUndefined();

    expect(referralRepository.saveReferral).not.toHaveBeenCalled();
  });

  it('lets the aggregate reject an unknown status', async () => {
    const { service, referralRepository } = buildService();

    await expect(
      service.applyReferralStatusUpdate({
        ...buildEvent(),
        status: 'BOGUS' as unknown as ReferralStatusUpdateEvent['status'],
      }),
    ).rejects.toThrow();

    expect(referralRepository.saveReferral).not.toHaveBeenCalled();
  });
});
