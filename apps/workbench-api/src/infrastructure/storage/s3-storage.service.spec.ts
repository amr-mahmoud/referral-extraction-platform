import { S3StorageService } from './s3-storage.service';

describe('S3StorageService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, S3_BUCKET_NAME: 'referral-workbench' };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('throws at construction when S3_BUCKET_NAME is unset', () => {
    delete process.env.S3_BUCKET_NAME;
    expect(() => new S3StorageService()).toThrow(
      'S3_BUCKET_NAME must be set to issue presigned referral upload URLs',
    );
  });

  describe('buildReferralPdfKey', () => {
    it('builds the referrals/{clinicId}/{referralId}.pdf key convention', () => {
      const clinicId = '11111111-1111-1111-1111-111111111111';
      const referralId = '22222222-2222-2222-2222-222222222222';

      const service = new S3StorageService();

      expect(service.buildReferralPdfKey(clinicId, referralId)).toBe(
        'referrals/11111111-1111-1111-1111-111111111111/22222222-2222-2222-2222-222222222222.pdf',
      );
    });
  });

  describe('getConfiguredBucketName', () => {
    it('returns the configured bucket name', () => {
      const service = new S3StorageService();
      expect(service.getConfiguredBucketName()).toBe('referral-workbench');
    });
  });
});
