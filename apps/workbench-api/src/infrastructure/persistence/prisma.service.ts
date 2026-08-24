import { Injectable } from '@nestjs/common';
import { NotImplementedError } from '../../application/errors/not-implemented.error';

@Injectable()
export class PrismaService {
  public connect(): Promise<void> {
    throw new NotImplementedError('PrismaService.connect');
  }

  public disconnect(): Promise<void> {
    throw new NotImplementedError('PrismaService.disconnect');
  }
}
