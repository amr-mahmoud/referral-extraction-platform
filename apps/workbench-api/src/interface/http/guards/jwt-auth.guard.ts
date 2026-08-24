import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { NotImplementedError } from '../../../application/errors/not-implemented.error';
import {
  TOKEN_PORT,
  type TokenPort,
} from '../../../application/ports/token.port';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  public constructor(
    @Inject(TOKEN_PORT) private readonly tokenService: TokenPort,
  ) {}

  public canActivate(context: ExecutionContext): boolean {
    void context;
    throw new NotImplementedError('JwtAuthGuard.canActivate');
  }
}
