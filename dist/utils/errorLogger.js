"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = logError;
exports.formatErrorWithTime = formatErrorWithTime;
/**
 * Utility function to log errors with timestamps
 */
function logError(message, error) {
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
function formatErrorWithTime(error, context) {
    const timestamp = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);
    const contextStr = context ? ` [${context}]` : "";
    return `[${timestamp}]${contextStr} ${errorMessage}`;
}
