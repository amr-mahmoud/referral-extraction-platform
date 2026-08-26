/**
 * Application-layer error codes, thrown as `ApplicationException`.
 *
 * Values are namespaced with an `APPLICATION_ERROR.` prefix so a serialized
 * error is unambiguous across every layer (domain, repository, application)
 * even when codes from different enums happen to share a member name.
 */
export enum APPLICATION_ERROR {
  GENERAL_APPLICATION_ERROR = 'APPLICATION_ERROR.GENERAL_APPLICATION_ERROR',
  UNEXPECTED_ERROR = 'APPLICATION_ERROR.UNEXPECTED_ERROR',
  OPERATION_FAILED = 'APPLICATION_ERROR.OPERATION_FAILED',
  INVALID_COMMAND = 'APPLICATION_ERROR.INVALID_COMMAND',
  BUSINESS_RULE_VIOLATION = 'APPLICATION_ERROR.BUSINESS_RULE_VIOLATION',
}

/**
 * Human-readable default message for each `APPLICATION_ERROR` member, used as
 * the response `message` when a thrown `ApplicationException` does not carry
 * its own. Kept next to the enum so the two cannot drift apart.
 */
export const APPLICATION_ERROR_MESSAGES: Record<APPLICATION_ERROR, string> = {
  [APPLICATION_ERROR.GENERAL_APPLICATION_ERROR]:
    'An unexpected error occurred while processing the request',
  [APPLICATION_ERROR.UNEXPECTED_ERROR]: 'An unexpected error occurred',
  [APPLICATION_ERROR.OPERATION_FAILED]:
    'The requested operation could not be completed',
  [APPLICATION_ERROR.INVALID_COMMAND]:
    'The request payload is not a valid command for this operation',
  [APPLICATION_ERROR.BUSINESS_RULE_VIOLATION]:
    'The operation violates a business rule',
};
