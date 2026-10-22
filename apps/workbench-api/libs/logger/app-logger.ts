import { Logger } from '@nestjs/common';

export type LogMetadata = Record<string, string | number | boolean | null>;

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

const SUPPORTED_LOG_LEVELS: readonly LogLevel[] = [
  'trace',
  'debug',
  'info',
  'warn',
  'error',
];
const DEFAULT_LOG_LEVEL: LogLevel = 'info';
const LOGGER_SOURCE_FILE_MARKER = 'app-logger.';
const ANONYMOUS_METHOD_NAME = 'anonymous';

/**
 * Nest's Logger extended with the project's log keys, caller tracking and the
 * `LOG_LEVEL` gate:
 *   - info / infoSuccess -> log (level `info`), trace -> verbose (level `trace`)
 *   - every line (including existing log / warn / error / debug calls) is
 *     tagged with `<Module>.<method>`, e.g. `[ApplicationService.getClinic]`,
 *     so the method name never has to be repeated in the message.
 *   - lines below the configured LOG_LEVEL are dropped before they are written.
 */
export class AppLogger extends Logger {
  private readonly moduleName: string;
  private readonly minimumLevel: LogLevel;

  public constructor(moduleName: string) {
    super(moduleName);
    this.moduleName = moduleName;
    this.minimumLevel = readConfiguredLogLevel();
  }

  public override log(message: unknown, ...optionalParams: unknown[]): void {
    this.writeWithCallerContext('info', () =>
      super.log(message, ...optionalParams),
    );
  }

  public override warn(message: unknown, ...optionalParams: unknown[]): void {
    this.writeWithCallerContext('warn', () =>
      super.warn(message, ...optionalParams),
    );
  }

  public override debug(message: unknown, ...optionalParams: unknown[]): void {
    this.writeWithCallerContext('debug', () =>
      super.debug(message, ...optionalParams),
    );
  }

  public override verbose(
    message: unknown,
    ...optionalParams: unknown[]
  ): void {
    this.writeWithCallerContext('trace', () =>
      super.verbose(message, ...optionalParams),
    );
  }

  public override error(message: unknown, ...optionalParams: unknown[]): void {
    this.writeWithCallerContext('error', () =>
      super.error(message, ...optionalParams),
    );
  }

  public info(message: string, metadata?: LogMetadata): void {
    this.log(formatMessageWithMetadata(message, metadata));
  }

  public infoSuccess(message: string, metadata?: LogMetadata): void {
    this.log(formatMessageWithMetadata(message, metadata));
  }

  public trace(message: string, metadata?: LogMetadata): void {
    this.verbose(formatMessageWithMetadata(message, metadata));
  }

  /**
   * Nest always appends its context as the last argument, so the context is
   * swapped to `<Module>.<method>` for this one synchronous write and restored
   * straight after. Skipped entirely when the level is below LOG_LEVEL.
   */
  private writeWithCallerContext(
    level: LogLevel,
    writeLogLine: () => void,
  ): void {
    if (!isLogLevelEnabled(level, this.minimumLevel)) {
      return;
    }
    const originalContext = this.context;
    this.context = `${this.moduleName}.${resolveCallerMethodName()}`;
    try {
      writeLogLine();
    } finally {
      this.context = originalContext;
    }
  }
}

/**
 * Reads `LOG_LEVEL` (loaded from the root `.env` by the app entry point).
 * Unset or empty means `info`. Any other unknown value fails fast at startup.
 */
export function readConfiguredLogLevel(): LogLevel {
  const rawLogLevel = process.env.LOG_LEVEL?.trim().toLowerCase();
  if (!rawLogLevel) {
    return DEFAULT_LOG_LEVEL;
  }
  const matchedLogLevel = SUPPORTED_LOG_LEVELS.find(
    (supportedLevel) => supportedLevel === rawLogLevel,
  );
  if (!matchedLogLevel) {
    throw new Error(
      `Invalid LOG_LEVEL "${rawLogLevel}"; expected one of ${SUPPORTED_LOG_LEVELS.join(', ')}`,
    );
  }
  return matchedLogLevel;
}

function isLogLevelEnabled(level: LogLevel, minimumLevel: LogLevel): boolean {
  return (
    SUPPORTED_LOG_LEVELS.indexOf(level) >=
    SUPPORTED_LOG_LEVELS.indexOf(minimumLevel)
  );
}

function formatMessageWithMetadata(
  message: string,
  metadata?: LogMetadata,
): string {
  if (metadata === undefined) {
    return message;
  }
  return `${message} ${JSON.stringify(metadata)}`;
}

/**
 * Returns the name of the first stack frame outside this logger file, i.e. the
 * method that called the logger. Falls back to `anonymous` for arrow functions
 * and callbacks that V8 does not name.
 */
function resolveCallerMethodName(): string {
  const stackFrameLines = (new Error().stack ?? '')
    .split('\n')
    .filter((line) => line.trim().startsWith('at '));
  const callerFrameLine = stackFrameLines.find(
    (line) => !line.includes(LOGGER_SOURCE_FILE_MARKER),
  );
  if (!callerFrameLine) {
    return ANONYMOUS_METHOD_NAME;
  }
  const qualifiedNameMatch = /^\s*at (?:async )?(?:new )?([^\s(]+)/.exec(
    callerFrameLine,
  );
  const qualifiedName = qualifiedNameMatch?.[1] ?? '';
  const methodName = qualifiedName.split('.').pop() ?? '';
  if (methodName === '' || methodName.startsWith('<')) {
    return ANONYMOUS_METHOD_NAME;
  }
  return methodName;
}
