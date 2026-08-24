import { Injectable } from '@nestjs/common';
import { NotImplementedError } from '../../application/errors/not-implemented.error';
import { TokenClaims, TokenPort } from '../../application/ports/token.port';

@Injectable()
export class JwtTokenService implements TokenPort {
  public sign(payload: TokenClaims): string {
    void payload;
    throw new NotImplementedError('JwtTokenService.sign');
  }

  public verify(token: string): TokenClaims {
    void token;
    throw new NotImplementedError('JwtTokenService.verify');
  }
}
