import { Injectable } from '@nestjs/common';
import { NotImplementedError } from '../../application/errors/not-implemented.error';
import {
  PresignedUrl,
  PresignPutOptions,
  StoragePort,
} from '../../application/ports/storage.port';
import { S3Object } from '../../domain/referral/s3-object.value-object';

@Injectable()
export class S3StorageService implements StoragePort {
  public presignPut(
    object: S3Object,
    options: PresignPutOptions,
  ): Promise<PresignedUrl> {
    void object;
    void options;
    throw new NotImplementedError('S3StorageService.presignPut');
  }

  public presignGet(object: S3Object): Promise<PresignedUrl> {
    void object;
    throw new NotImplementedError('S3StorageService.presignGet');
  }
}
