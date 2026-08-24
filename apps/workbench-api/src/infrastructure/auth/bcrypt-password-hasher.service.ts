import { Injectable } from '@nestjs/common';
import { NotImplementedError } from '../../application/errors/not-implemented.error';
import { PasswordHasherPort } from '../../application/ports/password-hasher.port';

@Injectable()
export class BcryptPasswordHasherService implements PasswordHasherPort {
  public hash(plainPassword: string): Promise<string> {
    void plainPassword;
    throw new NotImplementedError('BcryptPasswordHasherService.hash');
  }

  public verify(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    void plainPassword;
    void hashedPassword;
    throw new NotImplementedError('BcryptPasswordHasherService.verify');
  }
}
