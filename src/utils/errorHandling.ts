/**
 * @fileoverview Centralized error handling utilities for consistent error responses
 * @module utils/errorHandling
 * @description Provides standardized error formatting and async operation wrappers
 * for MCP tool calls with consistent error response formatting
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ValidationError } from '../validation/schemas.js';

/**
 * Creates a descriptive error message with appropriate detail level based on environment
 * @param {string} operation - Name of the operation that failed
 * @param {unknown} error - The error that occurred
 * @returns {string} Formatted error message, detailed in dev mode, generic in production
 * @private
 * @description
 * - Shows full error details in development mode or when DEBUG is set
 * - Always shows validation error details regardless of environment
 * - Returns generic messages in production for security
 */
function createErrorMessage(operation: string, error: unknown): string {
  const message =
    error instanceof Error ? error.message : 'System error occurred';
  const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG;

  // For validation errors, always return the detailed message.
  if (error instanceof ValidationError) {
    return message;
  }

  // For other errors, be generic in production.
  return isDev
    ? `Failed to ${operation}: ${message}`
    : `Failed to ${operation}: System error occurred`;
}

/**
 * Utility for handling async operations with consistent error handling and formatting
 * @param {() => Promise<string>} operation - Async function that returns markdown-formatted result
 * @param {string} operationName - Name of the operation for error messages
 * @returns {Promise<CallToolResult>} Standardized result with content and isError flag
 * @description
 * Wraps async operations to provide consistent:
 * - Success response formatting with markdown content
 * - Error handling with appropriate detail levels
 * - MCP CallToolResult format compliance
 * @example
 * return handleAsyncOperation(async () => {
 *   const result = await createReminder(data);
 *   return formatSuccessMessage('created', 'reminder', result.title, result.id);
 * }, 'create reminder');
 */
export async function handleAsyncOperation(
  operation: () => Promise<string>,
  operationName: string,
): Promise<CallToolResult> {
  try {
    const result = await operation();
    return {
      content: [{ type: 'text', text: result }],
      isError: false,
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: createErrorMessage(operationName, error),
        },
      ],
      isError: true,
    };
  }
}
