/**
 * Pulls a human-readable message out of an `openapi-fetch` error body.
 *
 * The API sends two different shapes for a rejected request: `message` is a
 * single string from `DomainExceptionFilter` (domain errors), but an array of
 * strings from Nest's built-in `ValidationPipe` (DTO shape errors, e.g. a
 * missing required property). Both are handled; anything else — a network
 * failure, an unmapped 500 — falls back to `fallback`.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error !== "object" || error === null || !("message" in error)) {
    return fallback;
  }

  const { message } = error as Record<string, unknown>;

  if (typeof message === "string") return message;
  if (
    Array.isArray(message) &&
    message.every((entry) => typeof entry === "string")
  ) {
    return message.join(", ");
  }

  return fallback;
}
