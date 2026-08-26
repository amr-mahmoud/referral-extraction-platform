/**
 * Infrastructure/repository-layer error codes, thrown as `RepositoryException`.
 *
 * These wrap raw infrastructure failures (Prisma, Redis, S3, JWT, bcrypt) so
 * the application layer never sees an untyped driver exception. The `details`
 * field on the exception carries the underlying cause message for logging.
 */
export enum REPOSITORY_ERROR {
  DATABASE_CONNECTION_FAILED = 'REPOSITORY_ERROR.DATABASE_CONNECTION_FAILED',
  DATABASE_QUERY_FAILED = 'REPOSITORY_ERROR.DATABASE_QUERY_FAILED',
  DATABASE_WRITE_FAILED = 'REPOSITORY_ERROR.DATABASE_WRITE_FAILED',
  DATABASE_TRANSACTION_FAILED = 'REPOSITORY_ERROR.DATABASE_TRANSACTION_FAILED',
  CACHE_WRITE_FAILED = 'REPOSITORY_ERROR.CACHE_WRITE_FAILED',
  STORAGE_PRESIGN_FAILED = 'REPOSITORY_ERROR.STORAGE_PRESIGN_FAILED',
  ENCRYPTION_OPERATION_FAILED = 'REPOSITORY_ERROR.ENCRYPTION_OPERATION_FAILED',
  TOKEN_OPERATION_FAILED = 'REPOSITORY_ERROR.TOKEN_OPERATION_FAILED',
}

/**
 * Human-readable default message for each `REPOSITORY_ERROR` member, used as
 * the response `message` when a thrown `RepositoryException` does not carry
 * its own.
 */
export const REPOSITORY_ERROR_MESSAGES: Record<REPOSITORY_ERROR, string> = {
  [REPOSITORY_ERROR.DATABASE_CONNECTION_FAILED]: 'Failed to reach the database',
  [REPOSITORY_ERROR.DATABASE_QUERY_FAILED]: 'A database read failed',
  [REPOSITORY_ERROR.DATABASE_WRITE_FAILED]: 'A database write failed',
  [REPOSITORY_ERROR.DATABASE_TRANSACTION_FAILED]:
    'A database transaction failed',
  [REPOSITORY_ERROR.CACHE_WRITE_FAILED]: 'Failed to write to the cache',
  [REPOSITORY_ERROR.STORAGE_PRESIGN_FAILED]:
    'Failed to generate a presigned storage URL',
  [REPOSITORY_ERROR.ENCRYPTION_OPERATION_FAILED]:
    'A password hashing operation failed',
  [REPOSITORY_ERROR.TOKEN_OPERATION_FAILED]:
    'A token signing or verification operation failed',
};
