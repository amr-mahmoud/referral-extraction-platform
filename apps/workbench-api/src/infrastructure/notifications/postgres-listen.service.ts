import { Injectable } from '@nestjs/common';
import { NotImplementedError } from '../../application/errors/not-implemented.error';

@Injectable()
export class PostgresListenService {
  public listen(): void {
    throw new NotImplementedError('PostgresListenService.listen');
  }

  public close(): void {
    throw new NotImplementedError('PostgresListenService.close');
  }
}
