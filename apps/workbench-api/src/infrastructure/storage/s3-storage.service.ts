import { Injectable } from '@nestjs/common';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  PresignedUrl,
  PresignPutOptions,
  S3Object,
  StoragePort,
} from '../../application/ports/storage.port';
import { ClinicId } from '../../domain/shared/ids/clinic-id.value-object';
import { ReferralId } from '../../domain/shared/ids/referral-id.value-object';

const DEFAULT_PRESIGN_EXPIRES_IN_SECONDS = 900;
const DEFAULT_CONTENT_TYPE = 'application/pdf';

/**
 * Signs against real AWS S3 in every environment — this project deliberately
 * runs no local S3 emulator (LocalStack/MinIO), so there is no `endpoint` or
 * `forcePathStyle` override here. The IAM user behind
 * `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` (picked up by the SDK's default
 * credential chain) must hold `s3:PutObject`/`s3:GetObject` on the bucket,
 * and the bucket must carry a CORS rule allowing the web app's origin —
 * neither of those is something code here can grant.
 */
@Injectable()
export class S3StorageService implements StoragePort {
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly presignExpiresInSeconds: number;

  public constructor() {
    const bucketName = process.env.S3_BUCKET_NAME;
    if (!bucketName || bucketName.trim() === '') {
      // Fail loudly at boot rather than letting a blank bucket surface later
      // as an opaque 403 on the browser's PUT.
      throw new Error(
        'S3_BUCKET_NAME must be set to issue presigned referral upload URLs',
      );
    }
    this.bucketName = bucketName;

    this.client = new S3Client({
      region: process.env.AWS_REGION ?? 'us-east-1',
    });

    this.presignExpiresInSeconds = process.env.S3_PRESIGN_EXPIRES_IN
      ? Number(process.env.S3_PRESIGN_EXPIRES_IN)
      : DEFAULT_PRESIGN_EXPIRES_IN_SECONDS;
  }

  public async presignReferralUpload(
    clinicId: ClinicId,
    referralId: ReferralId,
    options?: PresignPutOptions,
  ): Promise<PresignedUrl> {
    const key = this.buildReferralPdfKey(clinicId, referralId);
    return this.presignPut({ bucket: this.bucketName, key }, options);
  }

  public async presignPut(
    object: S3Object,
    options?: PresignPutOptions,
  ): Promise<PresignedUrl> {
    const expiresInSeconds =
      options?.expiresInSeconds ?? this.presignExpiresInSeconds;
    const contentType = options?.contentType ?? DEFAULT_CONTENT_TYPE;

    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        Bucket: object.bucket,
        Key: object.key,
        ContentType: contentType,
      }),
      { expiresIn: expiresInSeconds },
    );

    return {
      url,
      expiresAt: new Date(Date.now() + expiresInSeconds * 1000),
    };
  }

  public async presignGet(object: S3Object): Promise<PresignedUrl> {
    const url = await getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: object.bucket,
        Key: object.key,
      }),
      { expiresIn: this.presignExpiresInSeconds },
    );

    return {
      url,
      expiresAt: new Date(Date.now() + this.presignExpiresInSeconds * 1000),
    };
  }

  public getConfiguredBucketName(): string {
    return this.bucketName;
  }

  public buildReferralPdfKey(
    clinicId: ClinicId,
    referralId: ReferralId,
  ): string {
    return `referrals/${clinicId.value}/${referralId}.pdf`;
  }
}
