import { S3Object } from '../../domain/referral/s3-object.value-object';

export const STORAGE_PORT = 'STORAGE_PORT';

export interface PresignPutOptions {
  contentType: string;
  maxContentLength: number;
}

export interface PresignedUrl {
  url: string;
  expiresAt: Date;
}

export interface StoragePort {
  presignPut(
    object: S3Object,
    options: PresignPutOptions,
  ): Promise<PresignedUrl>;
  presignGet(object: S3Object): Promise<PresignedUrl>;
}
