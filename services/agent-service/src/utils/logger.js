/**
 * Unified Logger Configuration
 *
 * Uses @deepracticex/logger for consistent logging across the application.
 * Logs to both console and file (daily rotation).
 */

import { createLogger } from '@deepracticex/logger/nodejs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Log directory: project_root/logs
const logDir = path.join(__dirname, '../../logs');

// Create logger instance
export const logger = createLogger({
  // Log level from env or default to 'info'
  level: process.env.LOG_LEVEL || 'info',

  // Service name
  name: '@deepractice-ai/agent-service',

  // Enable console output (for development)
  console: true,

  // Enable file logging with daily rotation
  file: {
    dirname: logDir
  },

  // Enable colors (auto-disabled in MCP stdio mode)
  colors: true
});

// Export convenient log functions
export const { info, warn, error, debug, trace, fatal } = logger;

// Log startup
logger.info(`Logger initialized - logs directory: ${logDir}`);
logger.info(`Log level: ${process.env.LOG_LEVEL || 'info'}`);
