import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Single global exception filter, registered for every exception (`@Catch()`).
 *
 * Contract:
 * - Any `HttpException` — our typed `DomainException`/`ApplicationException`/
 *   `RepositoryException` AND Nest built-ins (validation, auth, not-found) —
 *   is answered with the status and response body it already carries. All three
 *   typed exceptions serialize `{ message, errorCode, details?, src?, methodSrc? }`
 *   plus a `timestamp`, so every non-2xx response is a consistent envelope.
 * - Anything else is a genuine bug/unknown: logged with its stack trace and
 *   answered 500 with a generic envelope that never leaks internals.
 */
@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionFilter.name);

  public catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const payload =
        typeof body === 'string'
          ? { statusCode: status, message: body }
          : { ...(body as Record<string, unknown>), statusCode: status };

      response.status(status).json({
        ...payload,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    this.logger.error(
      `Unhandled exception: ${
        exception instanceof Error
          ? (exception.stack ?? exception.message)
          : String(exception)
      }`,
    );

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    });
  }
}
