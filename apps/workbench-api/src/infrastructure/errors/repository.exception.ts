import { HttpException, HttpStatus } from '@nestjs/common';
import {
  REPOSITORY_ERROR,
  REPOSITORY_ERROR_MESSAGES,
} from '../../../libs/errors/repository-error-code.enum';

export class RepositoryException extends HttpException {
  public readonly errorCode: REPOSITORY_ERROR;
  public readonly details?: string;
  public readonly src?: string;
  public readonly methodSrc?: string;

  public constructor(
    errorCode: REPOSITORY_ERROR,
    details?: string,
    src?: string,
    methodSrc?: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super(
      {
        message: REPOSITORY_ERROR_MESSAGES[errorCode] ?? errorCode,
        errorCode,
        details,
        src,
        methodSrc,
      },
      statusCode,
    );
    this.errorCode = errorCode;
    this.details = details;
    this.src = src;
    this.methodSrc = methodSrc;
  }
}
