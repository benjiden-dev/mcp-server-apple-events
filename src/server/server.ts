/**
 * @fileoverview MCP server configuration and startup logic
 * @module server/server
 * @description Creates and manages the Model Context Protocol server instance
 * with stdio transport for Apple Reminders integration
 */

import 'exit-on-epipe';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { ServerConfig } from '../types/index.js';
import { registerHandlers } from './handlers.js';

/**
 * Creates and configures an MCP server instance with Apple Reminders capabilities
 * @param {ServerConfig} config - Server configuration including name and version
 * @returns {Server} Configured MCP server instance with registered handlers
 * @example
 * const server = createServer({
 *   name: 'apple-reminders-mcp',
 *   version: '1.0.0'
 * });
 */
export function createServer(config: ServerConfig): Server {
  const server = new Server(
    {
      name: config.name,
      version: config.version,
    },
    {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {},
      },
    },
  );

  // Register request handlers
  registerHandlers(server);

  return server;
}

/**
 * Starts the MCP server with stdio transport and graceful shutdown handling
 * @param {ServerConfig} config - Server configuration including name and version
 * @returns {Promise<void>} Promise that resolves when server is successfully started
 * @throws {Error} Exits with code 1 if server startup fails
 * @example
 * await startServer({
 *   name: 'apple-reminders-mcp',
 *   version: '1.0.0'
 * });
 */
export async function startServer(config: ServerConfig): Promise<void> {
  try {
    const server = createServer(config);
    const transport = new StdioServerTransport();

    // Handle process signals for graceful shutdown
    process.on('SIGINT', () => {
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      process.exit(0);
    });

    await server.connect(transport);
  } catch {
    process.exit(1);
  }
}
