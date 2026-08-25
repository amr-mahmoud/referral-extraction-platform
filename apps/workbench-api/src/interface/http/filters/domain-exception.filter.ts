import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../../../domain/shared/domain.error';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  public catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.BAD_REQUEST;

    switch (exception.code) {
      case 'CLINIC_NOT_FOUND':
        status = HttpStatus.NOT_FOUND;
        break;
      case 'INVALID_CREDENTIALS':
        status = HttpStatus.UNAUTHORIZED;
        break;
      case 'USERNAME_TAKEN':
        status = HttpStatus.CONFLICT;
        break;
      case 'INVALID_CLINIC_NAME':
      case 'INVALID_USERNAME':
      case 'INVALID_USERNAME_FORMAT':
      case 'WEAK_PASSWORD':
      case 'INVALID_PASSWORD_HASH':
        status = HttpStatus.BAD_REQUEST;
        break;
      case 'SCHEMA_NOT_FOUND':
      case 'REFERRAL_NOT_FOUND':
        status = HttpStatus.NOT_FOUND;
        break;
      case 'SCHEMA_ALREADY_FIXED':
      case 'CORRECTION_NOT_ALLOWED':
      case 'INVALID_REFERRAL_STATUS_TRANSITION':
        status = HttpStatus.CONFLICT;
        break;
      default:
        status = HttpStatus.BAD_REQUEST;
        break;
    }

    response.status(status).json({
      statusCode: status,
      error: exception.code,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
