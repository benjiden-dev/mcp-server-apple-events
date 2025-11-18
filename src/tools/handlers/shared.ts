/**
 * @fileoverview Shared helper functions for all handlers
 * @module tools/handlers/shared
 * @description Common utilities for argument validation, formatting, and error handling
 * Used across reminder, list, and calendar handlers for consistent behavior
 */

import type { ZodSchema } from 'zod/v3';
import type {
  CalendarsToolArgs,
  CalendarToolArgs,
  ListsToolArgs,
  RemindersToolArgs,
} from '../../types/index.js';
import { validateInput } from '../../validation/schemas.js';

/**
 * Extracts and validates arguments by removing action field and validating remaining properties
 * @template T - The expected type after validation
 * @param {RemindersToolArgs | ListsToolArgs | CalendarToolArgs | CalendarsToolArgs | undefined} args - Raw arguments from tool call
 * @param {ZodSchema<T>} schema - Zod schema for validation
 * @returns {T} Validated arguments with action field removed
 * @throws {Error} If validation fails according to schema
 * @example
 * const validated = extractAndValidateArgs(args, CreateReminderSchema);
 * // validated contains all args except 'action' field, validated against schema
 */
export const extractAndValidateArgs = <T>(
  args:
    | RemindersToolArgs
    | ListsToolArgs
    | CalendarToolArgs
    | CalendarsToolArgs
    | undefined,
  schema: ZodSchema<T>,
): T => {
  const { action: _, ...rest } = args ?? {};
  return validateInput(schema, rest);
};

/**
 * Formats a list of items as markdown with header and empty state message
 * @template T - The type of items in the list
 * @param {string} title - Section title for the markdown header
 * @param {T[]} items - Array of items to format
 * @param {(item: T) => string[]} formatItem - Function to format individual items
 * @param {string} emptyMessage - Message to display when items array is empty
 * @returns {string} Formatted markdown string with header and item list
 * @example
 * formatListMarkdown('Tasks', tasks, formatTask, 'No tasks found');
 * // Returns: "### Tasks (Total: 3)\n\n- [ ] Task 1\n- [x] Task 2"
 */
export const formatListMarkdown = <T>(
  title: string,
  items: T[],
  formatItem: (item: T) => string[],
  emptyMessage: string,
): string => {
  const lines: string[] = [`### ${title} (Total: ${items.length})`, ''];

  if (items.length === 0) {
    lines.push(emptyMessage);
  } else {
    items.forEach((item) => {
      lines.push(...formatItem(item));
    });
  }

  return lines.join('\n');
};

/**
 * Formats a success message with ID for created/updated items
 * @param {'created' | 'updated'} action - The action that was performed
 * @param {string} itemType - Type of item (reminder, list, event, etc.)
 * @param {string} title - Title/name of the item
 * @param {string} id - Unique identifier of the item
 * @returns {string} Formatted success message with ID
 * @example
 * formatSuccessMessage('created', 'reminder', 'Buy milk', 'ABC123')
 * // Returns: 'Successfully created reminder "Buy milk".
 * // - ID: ABC123'
 */
export const formatSuccessMessage = (
  action: 'created' | 'updated',
  itemType: string,
  title: string,
  id: string,
): string => {
  const actionText = action === 'created' ? 'created' : 'updated';
  const prefix =
    action === 'updated' && itemType === 'list'
      ? `Successfully updated ${itemType} to`
      : `Successfully ${actionText} ${itemType}`;
  return `${prefix} "${title}".\n- ID: ${id}`;
};

/**
 * Formats a delete success message with customizable formatting options
 * @param {string} itemType - Type of item being deleted (reminder, list, event, etc.)
 * @param {string} identifier - ID or name of the deleted item
 * @param {Object} [options] - Formatting options
 * @param {boolean} [options.useQuotes=true] - Whether to wrap identifier in quotes
 * @param {boolean} [options.useIdPrefix=true] - Whether to include "ID: " prefix
 * @param {boolean} [options.usePeriod=true] - Whether to end with period
 * @param {boolean} [options.useColon=true] - Whether to use colon in ID prefix
 * @returns {string} Formatted deletion confirmation message
 * @example
 * formatDeleteMessage('reminder', 'ABC123')
 * // Returns: 'Successfully deleted reminder with ID: "ABC123".'
 *
 * formatDeleteMessage('list', 'My List', { useQuotes: false, useIdPrefix: false })
 * // Returns: 'Successfully deleted list My List.'
 */
export const formatDeleteMessage = (
  itemType: string,
  identifier: string,
  options: {
    useQuotes?: boolean;
    useIdPrefix?: boolean;
    usePeriod?: boolean;
    useColon?: boolean;
  } = {},
): string => {
  const {
    useQuotes = true,
    useIdPrefix = true,
    usePeriod = true,
    useColon = true,
  } = options;
  const formattedId = useQuotes ? `"${identifier}"` : identifier;
  let idPart: string;
  if (useIdPrefix) {
    const separator = useColon ? ': ' : ' ';
    idPart = `with ID${separator}${formattedId}`;
  } else {
    idPart = formattedId;
  }
  const period = usePeriod ? '.' : '';
  return `Successfully deleted ${itemType} ${idPart}${period}`;
};
