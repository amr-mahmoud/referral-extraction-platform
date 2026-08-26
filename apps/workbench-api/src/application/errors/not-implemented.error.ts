import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Raised by a controller/use-case that is intentionally stubbed. Serves as the
 * documented contract for the endpoint until the real behaviour lands.
 */
export class NotImplementedError extends HttpException {
  public constructor(operation = 'operation') {
    super(
      {
        message: `Not implemented: ${operation}`,
        errorCode: 'NOT_IMPLEMENTED',
      },
      HttpStatus.NOT_IMPLEMENTED,
    );
    this.name = 'NotImplementedError';
  }
}
