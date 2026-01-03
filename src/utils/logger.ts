/**
 * Get formatted timestamp for logs
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Utility function to log errors with timestamps
 */
export function logError(message: string, error: any): void {
  const timestamp = getTimestamp();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`[${timestamp}] ${message}:`, {
    message: errorMessage,
    stack: errorStack,
    error: error,
  });
}

/**
 * Log info messages with timestamps
 */
export function logInfo(message: string, ...args: any[]): void {
  const timestamp = getTimestamp();
  console.log(`[${timestamp}] ${message}`, ...args);
}

/**
 * Log warning messages with timestamps
 */
export function logWarn(message: string, ...args: any[]): void {
  const timestamp = getTimestamp();
  console.warn(`[${timestamp}] ${message}`, ...args);
}

/**
 * Log debug messages with timestamps
 */
export function logDebug(message: string, ...args: any[]): void {
  const timestamp = getTimestamp();
  console.debug(`[${timestamp}] ${message}`, ...args);
}

/**
 * Format error for logging with timestamp
 */
export function formatErrorWithTime(error: any, context?: string): string {
  const timestamp = getTimestamp();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const contextStr = context ? ` [${context}]` : "";

  return `[${timestamp}]${contextStr} ${errorMessage}`;
}

