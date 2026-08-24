import { DomainError } from '../shared/domain.error';

export class InvalidS3ObjectError extends DomainError {
  public readonly code = 'INVALID_S3_OBJECT';

  constructor(message: string) {
    super(message);
  }
}

export class S3Object {
  public constructor(
    public readonly bucket: string,
    public readonly key: string,
  ) {
    if (typeof bucket !== 'string' || bucket.trim() === '') {
      throw new InvalidS3ObjectError('S3 bucket must be a non-empty string');
    }
    if (typeof key !== 'string' || key.trim() === '') {
      throw new InvalidS3ObjectError('S3 key must be a non-empty string');
    }
  }
}
