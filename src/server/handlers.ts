/**
 * @fileoverview MCP server request handlers
 * @module server/handlers
 * @description Registers and handles MCP protocol requests for tools, prompts, and resources
 */

import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { handleToolCall, TOOLS } from '../tools/index.js';
import type {
  CalendarToolArgs,
  ListsToolArgs,
  RemindersToolArgs,
} from '../types/index.js';
import {
  buildPromptResponse,
  getPromptDefinition,
  PROMPT_LIST,
} from './prompts.js';

/**
 * Registers all MCP protocol request handlers on the server instance
 * @param {Server} server - The MCP server instance to register handlers on
 * @returns {void}
 * @description Sets up handlers for:
 * - ListTools: Returns available tool definitions
 * - CallTool: Executes tool operations (reminders, lists, calendar events)
 * - ListPrompts: Returns available prompt templates
 * - GetPrompt: Generates specific prompt content
 * @example
 * const server = new Server(...);
 * registerHandlers(server);
 */
export function registerHandlers(server: Server): void {
  // Handler for listing available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS,
  }));

  // Handler for calling a tool
  server.setRequestHandler(CallToolRequestSchema, async (request) =>
    handleToolCall(
      request.params.name,
      (request.params.arguments as unknown as
        | RemindersToolArgs
        | ListsToolArgs
        | CalendarToolArgs) ?? {},
    ),
  );

  // Handler for listing available prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: PROMPT_LIST,
  }));

  // Handler for getting a specific prompt
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (typeof name !== 'string') {
      throw new Error('Prompt name must be a string.');
    }

    const promptDefinition = getPromptDefinition(name);

    if (!promptDefinition) {
      throw new Error(`Unknown prompt: ${name}`);
    }

    return buildPromptResponse(promptDefinition, args);
  });
}
