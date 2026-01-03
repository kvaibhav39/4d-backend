/**
 * Utility function to log errors with timestamps
 */
export function logError(message: string, error: any): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`[${timestamp}] ${message}:`, {
    message: errorMessage,
    stack: errorStack,
    error: error,
  });
}

/**
 * Format error for logging with timestamp
 */
export function formatErrorWithTime(error: any, context?: string): string {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const contextStr = context ? ` [${context}]` : "";

  return `[${timestamp}]${contextStr} ${errorMessage}`;
}
