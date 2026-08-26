import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { REPOSITORY_ERROR } from '../../../libs/errors/repository-error-code.enum';
import { TokenClaims, TokenPort } from '../../application/ports/token.port';
import { RepositoryException } from '../errors/repository.exception';

@Injectable()
export class JwtTokenService implements TokenPort {
  private readonly secret: string;
  private readonly expiresIn: jwt.SignOptions['expiresIn'];

  public constructor() {
    this.secret = process.env.JWT_SECRET ?? 'plena-dev-secret-change-me';
    this.expiresIn =
      (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) ?? '7d';
  }

  public sign(payload: TokenClaims): string {
    try {
      return jwt.sign(
        { clinicId: payload.clinicId, username: payload.username },
        this.secret,
        { expiresIn: this.expiresIn },
      );
    } catch (error) {
      throw new RepositoryException(
        REPOSITORY_ERROR.TOKEN_OPERATION_FAILED,
        error instanceof Error ? error.message : String(error),
        JwtTokenService.name,
        'sign',
      );
    }
  }

  public verify(token: string): TokenClaims {
    try {
      const decoded = jwt.verify(token, this.secret) as jwt.JwtPayload;
      return {
        clinicId: decoded.clinicId as string,
        username: decoded.username as string,
      };
    } catch (error) {
      throw new RepositoryException(
        REPOSITORY_ERROR.TOKEN_OPERATION_FAILED,
        error instanceof Error ? error.message : String(error),
        JwtTokenService.name,
        'verify',
      );
    }
  }
}
