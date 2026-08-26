import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { REPOSITORY_ERROR } from '../../../libs/errors/repository-error-code.enum';
import { EncryptionPort } from '../../application/ports/encryption.port';
import { RepositoryException } from '../errors/repository.exception';

const SALT_ROUNDS = 12;

@Injectable()
export class BcryptEncryptionService implements EncryptionPort {
  public async hash(plainText: string): Promise<string> {
    try {
      return await bcrypt.hash(plainText, SALT_ROUNDS);
    } catch (error) {
      throw new RepositoryException(
        REPOSITORY_ERROR.ENCRYPTION_OPERATION_FAILED,
        error instanceof Error ? error.message : String(error),
        BcryptEncryptionService.name,
        'hash',
      );
    }
  }

  public async verify(plainText: string, hashedText: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainText, hashedText);
    } catch (error) {
      throw new RepositoryException(
        REPOSITORY_ERROR.ENCRYPTION_OPERATION_FAILED,
        error instanceof Error ? error.message : String(error),
        BcryptEncryptionService.name,
        'verify',
      );
    }
  }
}
