export const ENCRYPTION_PORT = 'ENCRYPTION_PORT';

export interface EncryptionPort {
  hash(plainText: string): Promise<string>;
  verify(plainText: string, hashedText: string): Promise<boolean>;
}
