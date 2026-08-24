export const PASSWORD_HASHER_PORT = 'PASSWORD_HASHER_PORT';

export interface PasswordHasherPort {
  hash(plainPassword: string): Promise<string>;
  verify(plainPassword: string, hashedPassword: string): Promise<boolean>;
}
