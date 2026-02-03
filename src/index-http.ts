#!/usr/bin/env node

/**
 * index-http.ts
 * Entry point for the Apple Reminders MCP server (HTTP mode)
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { startHttpServer } from './server/http.js';
import { findProjectRoot } from './utils/projectUtils.js';

// Find project root and load package.json
const projectRoot = findProjectRoot();
const packageJson = JSON.parse(
  readFileSync(join(projectRoot, 'package.json'), 'utf-8'),
);

// Server configuration
const SERVER_CONFIG = {
  name: packageJson.name,
  version: packageJson.version,
};

// Start the application in HTTP mode
startHttpServer(SERVER_CONFIG).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
