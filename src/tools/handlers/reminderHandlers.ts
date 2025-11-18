/**
 * @fileoverview Handlers for reminder task operations
 * @module tools/handlers/reminderHandlers
 * @description Implements CRUD operations for Apple Reminders including read, create, update, delete
 * All operations validate input through Zod schemas and handle errors consistently
 */

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { RemindersToolArgs } from '../../types/index.js';
import { handleAsyncOperation } from '../../utils/errorHandling.js';
import { formatMultilineNotes } from '../../utils/helpers.js';
import { reminderRepository } from '../../utils/reminderRepository.js';
import {
  CreateReminderSchema,
  DeleteReminderSchema,
  ReadRemindersSchema,
  UpdateReminderSchema,
} from '../../validation/schemas.js';
import {
  extractAndValidateArgs,
  formatDeleteMessage,
  formatListMarkdown,
  formatSuccessMessage,
} from './shared.js';

/**
 * Formats a reminder object as markdown list items with structured details
 * @param {Object} reminder - Reminder object to format
 * @param {string} reminder.title - The reminder title
 * @param {boolean} reminder.isCompleted - Completion status
 * @param {string} [reminder.list] - Optional list name
 * @param {string} [reminder.id] - Optional reminder ID
 * @param {string} [reminder.notes] - Optional notes content
 * @param {string} [reminder.dueDate] - Optional due date
 * @param {string} [reminder.url] - Optional associated URL
 * @returns {string[]} Array of markdown formatted lines
 * @private
 * @example
 * formatReminderMarkdown({
 *   title: "Buy groceries",
 *   isCompleted: false,
 *   list: "Personal",
 *   dueDate: "2025-11-18 15:00:00"
 * })
 * // Returns: ["- [ ] Buy groceries", "  - List: Personal", "  - Due: 2025-11-18 15:00:00"]
 */
const formatReminderMarkdown = (reminder: {
  title: string;
  isCompleted: boolean;
  list?: string;
  id?: string;
  notes?: string;
  dueDate?: string;
  url?: string;
}): string[] => {
  const lines: string[] = [];
  const checkbox = reminder.isCompleted ? '[x]' : '[ ]';
  lines.push(`- ${checkbox} ${reminder.title}`);
  if (reminder.list) lines.push(`  - List: ${reminder.list}`);
  if (reminder.id) lines.push(`  - ID: ${reminder.id}`);
  if (reminder.notes)
    lines.push(`  - Notes: ${formatMultilineNotes(reminder.notes)}`);
  if (reminder.dueDate) lines.push(`  - Due: ${reminder.dueDate}`);
  if (reminder.url) lines.push(`  - URL: ${reminder.url}`);
  return lines;
};

/**
 * Permission checking is now handled in Swift layer (EventKitCLI.swift)
 * Swift layer uses EKEventStore.authorizationStatus() to check permission status
 * before operations, following EventKit best practices.
 *
 * TypeScript layer trusts Swift layer's permission handling and does not
 * duplicate permission checks here.
 */

/**
 * Creates a new reminder with the specified properties
 * @param {RemindersToolArgs} args - Creation arguments including title, notes, due date, etc.
 * @returns {Promise<CallToolResult>} Success result with created reminder details
 * @throws {Error} If validation fails or reminder creation fails
 * @example
 * await handleCreateReminder({
 *   action: 'create',
 *   title: 'Buy groceries',
 *   note: 'Milk, bread, eggs',
 *   dueDate: '2025-11-18 15:00:00',
 *   targetList: 'Personal'
 * });
 */
export const handleCreateReminder = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(args, CreateReminderSchema);
    const reminder = await reminderRepository.createReminder({
      title: validatedArgs.title,
      notes: validatedArgs.note,
      url: validatedArgs.url,
      list: validatedArgs.targetList,
      dueDate: validatedArgs.dueDate,
    });
    return formatSuccessMessage(
      'created',
      'reminder',
      reminder.title,
      reminder.id,
    );
  }, 'create reminder');
};

/**
 * Updates an existing reminder with new properties
 * @param {RemindersToolArgs} args - Update arguments including ID and new properties
 * @returns {Promise<CallToolResult>} Success result with updated reminder details
 * @throws {Error} If validation fails or reminder update fails
 * @example
 * await handleUpdateReminder({
 *   action: 'update',
 *   id: 'ABC123',
 *   title: 'Buy organic groceries',
 *   completed: true
 * });
 */
export const handleUpdateReminder = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(args, UpdateReminderSchema);
    const reminder = await reminderRepository.updateReminder({
      id: validatedArgs.id,
      newTitle: validatedArgs.title,
      notes: validatedArgs.note,
      url: validatedArgs.url,
      isCompleted: validatedArgs.completed,
      list: validatedArgs.targetList,
      dueDate: validatedArgs.dueDate,
    });
    return formatSuccessMessage(
      'updated',
      'reminder',
      reminder.title,
      reminder.id,
    );
  }, 'update reminder');
};

/**
 * Deletes a reminder by its unique ID
 * @param {RemindersToolArgs} args - Delete arguments containing the reminder ID
 * @returns {Promise<CallToolResult>} Success confirmation with deleted reminder ID
 * @throws {Error} If validation fails or reminder deletion fails
 * @example
 * await handleDeleteReminder({
 *   action: 'delete',
 *   id: 'ABC123'
 * });
 */
export const handleDeleteReminder = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(args, DeleteReminderSchema);
    await reminderRepository.deleteReminder(validatedArgs.id);
    return formatDeleteMessage('reminder', validatedArgs.id, {
      useQuotes: false,
      useIdPrefix: true,
      usePeriod: false,
    });
  }, 'delete reminder');
};

/**
 * Reads reminders with optional filtering and search capabilities
 * @param {RemindersToolArgs} args - Read arguments including filters and search criteria
 * @returns {Promise<CallToolResult>} Formatted list of reminders or single reminder details
 * @throws {Error} If validation fails or reminder retrieval fails
 * @description
 * - If ID is provided, returns single reminder details
 * - Otherwise returns filtered list based on criteria (list, completion status, search term, due date range)
 * @example
 * // Read all reminders
 * await handleReadReminders({ action: 'read' });
 *
 * // Read specific reminder by ID
 * await handleReadReminders({ action: 'read', id: 'ABC123' });
 *
 * // Search reminders
 * await handleReadReminders({
 *   action: 'read',
 *   search: 'groceries',
 *   showCompleted: true
 * });
 */
export const handleReadReminders = async (
  args: RemindersToolArgs,
): Promise<CallToolResult> => {
  return handleAsyncOperation(async () => {
    const validatedArgs = extractAndValidateArgs(args, ReadRemindersSchema);

    // Check if id is provided in args (before validation)
    // because id might be filtered out by schema validation if it's optional
    if (args.id) {
      const reminder = await reminderRepository.findReminderById(args.id);
      const markdownLines: string[] = [
        '### Reminder',
        '',
        ...formatReminderMarkdown(reminder),
      ];
      return markdownLines.join('\n');
    }

    // Otherwise, return all matching reminders
    const reminders = await reminderRepository.findReminders({
      list: validatedArgs.filterList,
      showCompleted: validatedArgs.showCompleted,
      search: validatedArgs.search,
      dueWithin: validatedArgs.dueWithin,
    });

    return formatListMarkdown(
      'Reminders',
      reminders,
      formatReminderMarkdown,
      'No reminders found matching the criteria.',
    );
  }, 'read reminders');
};
