export const STORAGE_PORT = 'STORAGE_PORT';

export interface S3Object {
  bucket: string;
  key: string;
}

export interface PresignPutOptions {
  contentType?: string;
  expiresInSeconds?: number;
  /**
   * Not yet signed into the request — see `S3StorageService.presignPut`.
   * The 20MB ceiling is currently enforced client-side (upload-candidate
   * manager) and by the worker's pre-extraction sanity check.
   */
  maxContentLength?: number;
}

export interface PresignedUrl {
  url: string;
  expiresAt: Date;
}

export interface StoragePort {
  presignReferralUpload(
    clinicId: string,
    referralId: string,
    options?: PresignPutOptions,
  ): Promise<PresignedUrl>;
  presignPut(
    object: S3Object,
    options?: PresignPutOptions,
  ): Promise<PresignedUrl>;
  presignGet(object: S3Object): Promise<PresignedUrl>;
  /** The bucket this adapter is configured against — the domain must not read `process.env` itself. */
  getConfiguredBucketName(): string;
  /**
   * The referral PDF key convention: `referrals/{clinicId}/{referralId}.pdf`.
   */
  buildReferralPdfKey(clinicId: string, referralId: string): string;
}
