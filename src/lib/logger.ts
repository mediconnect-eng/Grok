/**
 * Application Logger
 * Basic logging utility for production monitoring
 * Replace with Sentry or other service in production
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: any;
  error?: {
    message: string;
    stack?: string;
    name: string;
  };
}

/**
 * Format log entry for console/file output
 */
function formatLogEntry(entry: LogEntry): string {
  const { level, message, timestamp, context, error } = entry;
  let output = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (context) {
    output += `\n  Context: ${JSON.stringify(context)}`;
  }
  
  if (error) {
    output += `\n  Error: ${error.name}: ${error.message}`;
    if (error.stack) {
      output += `\n  Stack: ${error.stack}`;
    }
  }
  
  return output;
}

/**
 * Create log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  contextOrError?: any
): LogEntry {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
  };

  if (contextOrError instanceof Error) {
    entry.error = {
      name: contextOrError.name,
      message: contextOrError.message,
      stack: contextOrError.stack,
    };
  } else if (contextOrError) {
    entry.context = contextOrError;
  }

  return entry;
}

/**
 * Log info message
 */
export function logInfo(message: string, context?: any): void {
  const entry = createLogEntry('info', message, context);
  console.log(formatLogEntry(entry));
  
  // In production, send to logging service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to external logging service
  }
}

/**
 * Log warning message
 */
export function logWarning(message: string, context?: any): void {
  const entry = createLogEntry('warn', message, context);
  console.warn(formatLogEntry(entry));
  
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to external logging service
  }
}

/**
 * Log error message
 */
export function logError(message: string, error?: Error | any, context?: any): void {
  const entry = createLogEntry('error', message, error);
  if (context) {
    entry.context = context;
  }
  
  console.error(formatLogEntry(entry));
  
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to external logging service
    // Example: Sentry.captureException(error);
  }
}

/**
 * Log debug message (only in development)
 */
export function logDebug(message: string, context?: any): void {
  if (process.env.NODE_ENV === 'development') {
    const entry = createLogEntry('debug', message, context);
    console.debug(formatLogEntry(entry));
  }
}

/**
 * Log authentication events
 */
export function logAuth(event: 'login' | 'logout' | 'signup' | 'failed', userId?: string, details?: any): void {
  logInfo(`Auth event: ${event}`, {
    userId,
    ...details,
  });
}

/**
 * Log API requests (for debugging)
 */
export function logRequest(method: string, path: string, statusCode: number, duration?: number): void {
  logInfo(`API ${method} ${path} - ${statusCode}`, {
    method,
    path,
    statusCode,
    duration: duration ? `${duration}ms` : undefined,
  });
}

/**
 * Log database operations
 */
export function logDatabase(operation: string, table?: string, error?: Error): void {
  if (error) {
    logError(`Database ${operation} failed`, error, { table });
  } else {
    logDebug(`Database ${operation}`, { table });
  }
}

/**
 * Export logger object for convenience
 */
export const logger = {
  info: logInfo,
  warn: logWarning,
  error: logError,
  debug: logDebug,
  auth: logAuth,
  request: logRequest,
  database: logDatabase,
};

export default logger;
