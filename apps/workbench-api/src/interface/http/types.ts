import type { Request } from 'express';
import type { TokenClaims } from '../../application/ports/token.port';

/** An Express request carrying the JWT claims attached by `JwtAuthGuard`. */
export interface AuthenticatedRequest extends Request {
  user: TokenClaims;
}
