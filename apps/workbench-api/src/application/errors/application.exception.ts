import { HttpException, HttpStatus } from '@nestjs/common';
import {
  APPLICATION_ERROR,
  APPLICATION_ERROR_MESSAGES,
} from '../../../libs/errors/application-error-code.enum';

/**
 * Base exception for the application (use-case) layer. Covers unexpected
 * failures that escape an orchestrated use case and cannot be classified as a
 * domain or repository concern — the layer's catch-all.
 *
 * `src`/`methodSrc` name the origin class and method so the response carries
 * enough context to trace the failing use case without leaking the underlying
 * cause (`details` is the safe-to-log message of that cause).
 */
export class ApplicationException extends HttpException {
  public readonly errorCode: APPLICATION_ERROR;
  public readonly details?: string;
  public readonly src?: string;
  public readonly methodSrc?: string;

  public constructor(
    errorCode: APPLICATION_ERROR,
    details?: string,
    src?: string,
    methodSrc?: string,
  ) {
    super(
      {
        message: APPLICATION_ERROR_MESSAGES[errorCode] ?? errorCode,
        errorCode,
        details,
        src,
        methodSrc,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    this.errorCode = errorCode;
    this.details = details;
    this.src = src;
    this.methodSrc = methodSrc;
  }
}

export function translateError(error: unknown, methodSrc: string): never {
  if (error instanceof HttpException) {
    throw error;
  }
  throw new ApplicationException(
    APPLICATION_ERROR.GENERAL_APPLICATION_ERROR,
    error instanceof Error ? error.message : String(error),
    'ApplicationService',
    methodSrc,
  );
}
