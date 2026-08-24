import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EncryptionPort } from '../../application/ports/encryption.port';

const SALT_ROUNDS = 12;

@Injectable()
export class BcryptEncryptionService implements EncryptionPort {
  public async hash(plainText: string): Promise<string> {
    return bcrypt.hash(plainText, SALT_ROUNDS);
  }

  public async verify(
    plainText: string,
    hashedText: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainText, hashedText);
  }
}
