import express from 'express';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type { ServerConfig } from '../types/index.js';
import { createServer } from './server.js';

/**
 * Starts the MCP server in HTTP mode using SSE
 * @param config - Server configuration
 */
export async function startHttpServer(config: ServerConfig): Promise<void> {
  const app = express();
  const server = createServer(config);

  // Create a new SSE transport
  // The SDK handles the connection lifecycle
  let transport: SSEServerTransport;

  app.get('/sse', async (req, res) => {
    transport = new SSEServerTransport('/message', res);
    await server.connect(transport);
  });

  app.post('/message', async (req, res) => {
    if (!transport) {
      res.status(400).send('No active connection');
      return;
    }
    await transport.handlePostMessage(req, res);
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.error(`Server listening on port ${port}`);
  });
}
