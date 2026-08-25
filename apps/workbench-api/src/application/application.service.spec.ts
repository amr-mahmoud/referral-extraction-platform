/* eslint-disable @typescript-eslint/unbound-method -- jest mock function
   references passed to `expect()` are never invoked unbound. */
import { ApplicationService } from './application.service';
import { ReferralFileNameError } from '../domain/referral/referral.errors';
import { ReferralValidationError } from '../domain/referral/referral.errors';
import { CachingServicePort } from './ports/caching.port';
import { ClinicRepositoryPort } from './ports/clinic-repository.port';
import { ReferralRepositoryPort } from './ports/referral-repository.port';
import { StoragePort } from './ports/storage.port';
import { ClinicId } from '../domain/shared/ids/clinic-id.value-object';
import { ExtractionSchemaId } from '../domain/shared/ids/extraction-schema-id.value-object';
import type { ReferralView } from './read-models/referral-view.read-model';

describe('ApplicationService.createNewReferralsWithAttachedPresignedUrls', () => {
  const clinicId = ClinicId.from('11111111-1111-1111-1111-111111111111');

  function buildService(overrides?: {
    clinicRepository?: Partial<ClinicRepositoryPort>;
    referralRepository?: Partial<ReferralRepositoryPort>;
    storageService?: Partial<StoragePort>;
    cachingService?: Partial<CachingServicePort>;
  }) {
    const clinicRepository: ClinicRepositoryPort = {
      findById: jest.fn().mockResolvedValue({
        defaultExtractionSchemaId: null,
      }),
      findByUsername: jest.fn(),
      save: jest.fn(),
      saveExtractionSchema: jest.fn(),
      findLatestSchemaVersion: jest.fn(),
      findExtractionSchemaById: jest.fn(),
      listExtractionSchemasByClinic: jest.fn(),
      ...overrides?.clinicRepository,
    };

    const referralRepository: ReferralRepositoryPort = {
      findReferralById: jest.fn(),
      findReferralByIdForClinic: jest.fn(),
      findPaginatedReferralsByClinicId: jest.fn(),
      saveReferral: jest.fn(),
      saveReferrals: jest.fn((referrals) => Promise.resolve(referrals)),
      findReferralViewsByClinicId: jest.fn().mockResolvedValue([]),
      findReferralViewsByIds: jest.fn().mockResolvedValue([]),
      findAllReferralViews: jest.fn().mockResolvedValue([]),
      ...overrides?.referralRepository,
    };

    const storageService: StoragePort = {
      presignReferralUpload: jest.fn((_clinicId, referralId) =>
        Promise.resolve({
          url: `https://s3/${referralId}`,
          expiresAt: new Date(),
        }),
      ),
      presignPut: jest.fn(),
      presignGet: jest.fn(),
      getConfiguredBucketName: jest.fn().mockReturnValue('referral-workbench'),
      buildReferralPdfKey: jest.fn(),
      ...overrides?.storageService,
    };

    const cachingService: CachingServicePort = {
      setManyReferralCaches: jest.fn().mockResolvedValue(undefined),
      getReferralCache: jest.fn(),
      setReferralView: jest.fn().mockResolvedValue(undefined),
      setManyReferralViews: jest.fn().mockResolvedValue(undefined),
      getReferralView: jest.fn().mockResolvedValue(null),
      getManyReferralViews: jest.fn().mockResolvedValue([]),
      addReferralIdsToClinicIndex: jest.fn().mockResolvedValue(undefined),
      getClinicReferralIds: jest.fn().mockResolvedValue(null),
      ...overrides?.cachingService,
    };

    const service = new ApplicationService(
      clinicRepository,
      referralRepository,
      // encryptionService / tokenService are unused by this method
      {} as never,
      {} as never,
      storageService,
      cachingService,
    );

    return {
      service,
      clinicRepository,
      referralRepository,
      storageService,
      cachingService,
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
    expect(cachingService.setManyReferralCaches).not.toHaveBeenCalled();
  });

  it('caches one entry per referral, matching referralId, fileName, and the resolved schema', async () => {
    const schemaId = '22222222-2222-2222-2222-222222222222';
    const { service, cachingService, clinicRepository } = buildService({
      clinicRepository: {
        findExtractionSchemaById: jest.fn().mockResolvedValue({
          id: schemaId,
          version: 2,
          clinicId,
          schemaDefinition: [
            {
              key: 'patient_name',
              label: 'Patient Name',
              description: 'Full name',
            },
          ],
        }),
      },
    });

    const results = await service.createNewReferralsWithAttachedPresignedUrls({
      clinicId,
      files: [{ fileName: 'a.pdf' }, { fileName: 'b.pdf' }],
      extractionSchemaId: ExtractionSchemaId.from(schemaId),
    });

    expect(clinicRepository.findExtractionSchemaById).toHaveBeenCalledTimes(1);
    expect(cachingService.setManyReferralCaches).toHaveBeenCalledTimes(1);

    const entries = jest.mocked(cachingService.setManyReferralCaches).mock
      .calls[0][0];
    expect(entries).toHaveLength(2);
    entries.forEach((entry, index) => {
      expect(entry.referralId).toBe(results[index].referral.id);
      expect(entry.fileName).toBe(results[index].referral.fileName);
    });
    expect(entries[0].extractionSchema).toEqual({
      id: schemaId,
      version: 2,
      schemaDefinition: [
        {
          key: 'patient_name',
          label: 'Patient Name',
          description: 'Full name',
        },
      ],
    });
  });

  it('fails the whole request when the cache write fails (fail-closed)', async () => {
    const { service, referralRepository } = buildService({
      cachingService: {
        setManyReferralCaches: jest
          .fn()
          .mockRejectedValue(new Error('ECONNREFUSED')),
      },
    });

    await expect(
      service.createNewReferralsWithAttachedPresignedUrls({
        clinicId,
        files: [{ fileName: 'a.pdf' }],
      }),
    ).rejects.toThrow('Failed to create referrals');

    // The referrals were already persisted before the cache write — this
    // test documents that the failure surfaces to the caller (fail-closed),
    // not that persistence itself rolls back.
    expect(referralRepository.saveReferrals).toHaveBeenCalledTimes(1);
  });
});

describe('ApplicationService.listReferralViewsByClinic', () => {
  const clinicId = ClinicId.from('11111111-1111-1111-1111-111111111111');

  function buildService(overrides?: {
    referralRepository?: Partial<ReferralRepositoryPort>;
    cachingService?: Partial<CachingServicePort>;
  }) {
    const clinicRepository: ClinicRepositoryPort = {
      findById: jest.fn(),
      findByUsername: jest.fn(),
      save: jest.fn(),
      saveExtractionSchema: jest.fn(),
      findLatestSchemaVersion: jest.fn(),
      findExtractionSchemaById: jest.fn(),
      listExtractionSchemasByClinic: jest.fn(),
    };

    const referralRepository: ReferralRepositoryPort = {
      findReferralById: jest.fn(),
      findReferralByIdForClinic: jest.fn(),
      findPaginatedReferralsByClinicId: jest.fn(),
      saveReferral: jest.fn(),
      saveReferrals: jest.fn(),
      findReferralViewsByClinicId: jest.fn().mockResolvedValue([]),
      findReferralViewsByIds: jest.fn().mockResolvedValue([]),
      findAllReferralViews: jest.fn().mockResolvedValue([]),
      ...overrides?.referralRepository,
    };

    const cachingService: CachingServicePort = {
      setManyReferralCaches: jest.fn(),
      getReferralCache: jest.fn(),
      setReferralView: jest.fn().mockResolvedValue(undefined),
      setManyReferralViews: jest.fn().mockResolvedValue(undefined),
      getReferralView: jest.fn().mockResolvedValue(null),
      getManyReferralViews: jest.fn().mockResolvedValue([]),
      addReferralIdsToClinicIndex: jest.fn().mockResolvedValue(undefined),
      getClinicReferralIds: jest.fn().mockResolvedValue(null),
      ...overrides?.cachingService,
    };

    const service = new ApplicationService(
      clinicRepository,
      referralRepository,
      {} as never,
      {} as never,
      {} as never,
      cachingService,
    );

    return { service, referralRepository, cachingService };
  }

  function buildView(overrides?: Partial<ReferralView>): ReferralView {
    return {
      id: 'referral-1',
      clinicId: clinicId.value,
      fileName: 'a.pdf',
      patientName: null,
      status: 'AWAITING_UPLOAD',
      extractionSchemaId: null,
      extractionSchemaVersion: null,
      errorMessage: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      ...overrides,
    };
  }

  it('serves entirely from Redis on a full cache hit, without touching Postgres', async () => {
    const view = buildView();
    const { service, referralRepository } = buildService({
      cachingService: {
        getClinicReferralIds: jest.fn().mockResolvedValue([view.id]),
        getManyReferralViews: jest.fn().mockResolvedValue([view]),
      },
    });

    const results = await service.listReferralViewsByClinic(clinicId);

    expect(results).toEqual([view]);
    expect(
      referralRepository.findReferralViewsByClinicId,
    ).not.toHaveBeenCalled();
    expect(referralRepository.findReferralViewsByIds).not.toHaveBeenCalled();
  });

  it('rebuilds from Postgres and backfills Redis when the clinic index key is entirely absent', async () => {
    const view = buildView();
    const { service, cachingService } = buildService({
      cachingService: {
        getClinicReferralIds: jest.fn().mockResolvedValue(null),
      },
      referralRepository: {
        findReferralViewsByClinicId: jest.fn().mockResolvedValue([view]),
      },
    });

    const results = await service.listReferralViewsByClinic(clinicId);

    expect(results).toEqual([view]);
    expect(cachingService.setManyReferralViews).toHaveBeenCalledWith([view]);
    expect(cachingService.addReferralIdsToClinicIndex).toHaveBeenCalledWith(
      clinicId.value,
      [view.id],
    );
  });

  it('returns an empty list without touching Postgres when the index exists but is empty', async () => {
    const { service, referralRepository } = buildService({
      cachingService: { getClinicReferralIds: jest.fn().mockResolvedValue([]) },
    });

    const results = await service.listReferralViewsByClinic(clinicId);

    expect(results).toEqual([]);
    expect(
      referralRepository.findReferralViewsByClinicId,
    ).not.toHaveBeenCalled();
  });

  it('backfills only the ids that missed the cache on a partial miss', async () => {
    const cachedView = buildView({ id: 'referral-cached' });
    const missingView = buildView({ id: 'referral-missing' });
    const { service, referralRepository, cachingService } = buildService({
      cachingService: {
        getClinicReferralIds: jest
          .fn()
          .mockResolvedValue([cachedView.id, missingView.id]),
        getManyReferralViews: jest.fn().mockResolvedValue([cachedView, null]),
      },
      referralRepository: {
        findReferralViewsByIds: jest.fn().mockResolvedValue([missingView]),
      },
    });

    const results = await service.listReferralViewsByClinic(clinicId);

    expect(referralRepository.findReferralViewsByIds).toHaveBeenCalledWith([
      missingView.id,
    ]);
    expect(cachingService.setManyReferralViews).toHaveBeenCalledWith([
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
        getManyReferralViews: jest.fn().mockResolvedValue([older, newer]),
      },
    });

    const results = await service.listReferralViewsByClinic(clinicId);

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
        findReferralViewsByClinicId: jest.fn().mockResolvedValue([view]),
      },
    });

    const results = await service.listReferralViewsByClinic(clinicId);

    expect(results).toEqual([view]);
  });
});
