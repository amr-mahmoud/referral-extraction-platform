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
 * Console-backed logger with the same keys as the workbench-api AppLogger:
 * info / infoSuccess -> stdout, debug / trace -> debug stream.
 * Every line is tagged `[<Module>.<method>]`, where the method is the caller,
 * and lines below the configured LOG_LEVEL are dropped.
 */
export class AppLogger {
  private readonly minimumLevel: LogLevel;

  public constructor(private readonly moduleName: string) {
    this.minimumLevel = readConfiguredLogLevel();
  }

  public info(message: string, metadata?: LogMetadata): void {
    this.writeLine('info', message, metadata, console.log);
  }

  public infoSuccess(message: string, metadata?: LogMetadata): void {
    this.writeLine('info', message, metadata, console.log);
  }

  public debug(message: string, metadata?: LogMetadata): void {
    this.writeLine('debug', message, metadata, console.debug);
  }

  public trace(message: string, metadata?: LogMetadata): void {
    this.writeLine('trace', message, metadata, console.debug);
  }

  public warn(message: string, metadata?: LogMetadata): void {
    this.writeLine('warn', message, metadata, console.warn);
  }

  public error(message: string, metadata?: LogMetadata): void {
    this.writeLine('error', message, metadata, console.error);
  }

  private writeLine(
    level: LogLevel,
    message: string,
    metadata: LogMetadata | undefined,
    writeToConsole: (line: string) => void,
  ): void {
    if (!isLogLevelEnabled(level, this.minimumLevel)) {
      return;
    }
    writeToConsole(this.formatLine(message, metadata));
  }

  private formatLine(message: string, metadata?: LogMetadata): string {
    const prefixedMessage = `[${this.moduleName}.${resolveCallerMethodName()}] ${message}`;
    if (metadata === undefined) {
      return prefixedMessage;
    }
    return `${prefixedMessage} ${JSON.stringify(metadata)}`;
  }
}

/**
 * Reads `LOG_LEVEL` (the worker's env schema validates it at startup as well).
 * Unset or empty means `info`. Any other unknown value fails fast.
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
