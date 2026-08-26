import { HttpException } from '@nestjs/common';
import {
  DOMAIN_ERROR,
  DOMAIN_ERROR_STATUS,
} from '../../../libs/errors/domain-error-code.enum';

/**
 * Base class for every domain invariant violation.
 *
 * Extending `HttpException` (rather than a bare `Error`) means a domain error
 * IS a self-describing HTTP response: the concrete subclass pins its
 * `DOMAIN_ERROR` code, and the HTTP status is derived centrally from the
 * shared `DOMAIN_ERROR_STATUS` map in `libs/errors`. The interface layer only
 * has to render whatever an `HttpException` already carries — no per-code
 * switch anywhere.
 */
export abstract class DomainException extends HttpException {
  public readonly errorCode: DOMAIN_ERROR;

  protected constructor(errorCode: DOMAIN_ERROR, message: string) {
    super({ message, errorCode }, DOMAIN_ERROR_STATUS[errorCode]);
    this.errorCode = errorCode;
  }
}
