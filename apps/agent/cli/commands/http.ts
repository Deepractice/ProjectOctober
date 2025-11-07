/**
 * HTTP Command
 * Starts the HTTP server with WebSocket support
 * Sets up environment variables and starts the agent server
 */
import type { HttpCommandOptions } from "../types.js";

/**
 * Setup environment variables from CLI options
 */
function setupEnvironment(options: HttpCommandOptions): void {
  // Set NODE_ENV
  process.env.NODE_ENV = options.nodeEnv;

  // Set PORT
  process.env.PORT = options.port;

  // Set PROJECT_PATH if provided
  if (options.project) {
    process.env.PROJECT_PATH = options.project;
  }

  // Set ANTHROPIC_API_KEY if provided
  if (options.anthropicApiKey) {
    process.env.ANTHROPIC_API_KEY = options.anthropicApiKey;
  }

  // Set ANTHROPIC_BASE_URL if provided
  if (options.anthropicBaseUrl) {
    process.env.ANTHROPIC_BASE_URL = options.anthropicBaseUrl;
  }
}

/**
 * HTTP Command Handler
 */
export async function httpCommand(options: HttpCommandOptions): Promise<void> {
  console.log("🚀 Starting Deepractice AI Agent...\n");

  // Setup environment variables from CLI options
  setupEnvironment(options);

  console.log("📋 Environment configured:");
  console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`   PORT: ${process.env.PORT}`);
  console.log(`   HOST: ${options.host}`);
  if (process.env.PROJECT_PATH) {
    console.log(`   PROJECT_PATH: ${process.env.PROJECT_PATH}`);
  }
  if (process.env.ANTHROPIC_API_KEY) {
    console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY.substring(0, 6)}***`);
  }
  console.log("");

  // Import and start the agent server
  try {
    const { startServer } = await import("../server/index.js");

    // Start the server with our options
    await startServer({
      host: options.host,
      loadEnv: false, // Don't load .env files, we already set environment
    });
  } catch (error) {
    console.error("❌ Failed to start agent:", error);
    process.exit(1);
  }
}
