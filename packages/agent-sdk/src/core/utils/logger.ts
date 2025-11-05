// WORKAROUND: Use nodejs subpath to avoid node-adapter.js import error in @deepracticex/logger@1.1.1
// @ts-expect-error - Type resolution issue with subpath exports, but runtime works fine
import { createLogger, type Logger } from "@deepracticex/logger/nodejs";
import type { LoggerConfig } from "~/types";

/**
 * Create logger instance for agent-sdk
 * If no config provided, creates a minimal console-only logger
 */
export function createSDKLogger(config?: LoggerConfig): Logger {
  // If no config provided, use minimal default (console only)
  if (!config) {
    return createLogger({
      level: "info",
      name: "@deepractice-ai/agent-sdk",
      console: true,
      colors: false,
    });
  }

  return createLogger({
    level: config.level || "info",
    name: "@deepractice-ai/agent-sdk",
    console: config.console ?? false,
    file: config.file,
    colors: config.colors ?? false,
  });
}

/**
 * Default logger instance for internal use
 * Creates a minimal logger with console output disabled
 */
export const logger = createLogger({
  level: "error", // Only log errors by default
  name: "@deepractice-ai/agent-sdk",
  console: false,
  colors: false,
});
