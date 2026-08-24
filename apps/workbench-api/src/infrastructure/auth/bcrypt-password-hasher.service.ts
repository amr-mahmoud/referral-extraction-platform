import { Injectable } from '@nestjs/common';
import { NotImplementedError } from '../../application/errors/not-implemented.error';
import { EncryptionPort } from '../../application/ports/encryption.port';

@Injectable()
export class BcryptEncryptionService implements EncryptionPort {
  public hash(plainText: string): Promise<string> {
    void plainText;
    throw new NotImplementedError('BcryptEncryptionService.hash');
  }

  public verify(
    plainText: string,
    hashedText: string,
  ): Promise<boolean> {
    void plainText;
    void hashedText;
    throw new NotImplementedError('BcryptEncryptionService.verify');
  }
}
