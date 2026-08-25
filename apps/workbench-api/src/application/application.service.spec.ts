/* eslint-disable @typescript-eslint/unbound-method -- jest mock function
   references passed to `expect()` are never invoked unbound. */
import { ApplicationService } from './application.service';
import { ReferralFileNameError } from '../domain/referral/referral.errors';
import { ReferralValidationError } from '../domain/referral/referral.errors';
import { ClinicRepositoryPort } from './ports/clinic-repository.port';
import { ReferralRepositoryPort } from './ports/referral-repository.port';
import { StoragePort } from './ports/storage.port';
import { ClinicId } from '../domain/shared/ids/clinic-id.value-object';

describe('ApplicationService.createNewReferralsWithAttachedPresignedUrls', () => {
  const clinicId = ClinicId.from('11111111-1111-1111-1111-111111111111');

  function buildService(overrides?: {
    clinicRepository?: Partial<ClinicRepositoryPort>;
    referralRepository?: Partial<ReferralRepositoryPort>;
    storageService?: Partial<StoragePort>;
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

    const service = new ApplicationService(
      clinicRepository,
      referralRepository,
      // encryptionService / tokenService are unused by this method
      {} as never,
      {} as never,
      storageService,
    );

    return { service, clinicRepository, referralRepository, storageService };
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

  it('rejects an empty file list before any repository or storage call', async () => {
    const { service, referralRepository, storageService } = buildService();

    await expect(
      service.createNewReferralsWithAttachedPresignedUrls({
        clinicId,
        files: [],
      }),
    ).rejects.toThrow(ReferralValidationError);

    expect(referralRepository.saveReferrals).not.toHaveBeenCalled();
    expect(storageService.presignReferralUpload).not.toHaveBeenCalled();
  });
});
