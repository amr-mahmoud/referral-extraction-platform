export const TOKEN_PORT = 'TOKEN_PORT';

export interface TokenClaims {
  clinicId: string;
  username: string;
}

export interface TokenPort {
  sign(payload: TokenClaims): string;
  verify(token: string): TokenClaims;
}
