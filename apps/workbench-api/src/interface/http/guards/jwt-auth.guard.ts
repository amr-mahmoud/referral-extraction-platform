import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
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
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Bearer token is missing');
    }

    try {
      const claims = this.tokenService.verify(token);
      (request as Request & { user?: typeof claims }).user = claims;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }
  }
}
