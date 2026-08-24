import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { TokenClaims, TokenPort } from '../../application/ports/token.port';

@Injectable()
export class JwtTokenService implements TokenPort {
  private readonly secret: string;
  private readonly expiresIn: jwt.SignOptions['expiresIn'];

  public constructor() {
    this.secret = process.env.JWT_SECRET ?? 'plena-dev-secret-change-me';
    this.expiresIn = (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) ?? '7d';
  }

  public sign(payload: TokenClaims): string {
    return jwt.sign(
      { clinicId: payload.clinicId, username: payload.username },
      this.secret,
      { expiresIn: this.expiresIn },
    );
  }

  public verify(token: string): TokenClaims {
    const decoded = jwt.verify(token, this.secret) as jwt.JwtPayload;
    return {
      clinicId: decoded.clinicId as string,
      username: decoded.username as string,
    };
  }
}
