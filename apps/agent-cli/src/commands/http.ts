/**
 * HTTP Command
 * Starts the HTTP server with WebSocket support
 * Sets up environment variables and loads agent-service
 */
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
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
    console.log(
      `   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY.substring(0, 6)}***`
    );
  }
  console.log("");

  // Now dynamically import and start agent-service
  try {
    // Detect runtime environment and choose the correct service path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Path to bundled service (in npm package or after build)
    // When tsup bundles with splitting, chunks might be at different levels
    // So we always resolve from dist root
    let distRoot = __dirname;
    while (!existsSync(join(distRoot, "runtime"))) {
      const parent = dirname(distRoot);
      if (parent === distRoot) break; // Reached filesystem root
      distRoot = parent;
    }

    const bundledServicePath = join(distRoot, "runtime/service.js");

    // Path to source service (in monorepo development)
    const sourceServicePath = join(
      __dirname,
      "../../../../services/agent-service/src/index.js"
    );

    let servicePath: string;
    if (existsSync(bundledServicePath)) {
      servicePath = bundledServicePath;
      console.log("📦 Loading bundled agent-service...\n");
    } else if (existsSync(sourceServicePath)) {
      servicePath = sourceServicePath;
      console.log("📦 Loading agent-service from source...\n");
    } else {
      throw new Error(
        "Could not find agent-service. Please rebuild the CLI or check your installation."
      );
    }

    // Import the startServer function
    const { startServer } = await import(servicePath);

    // Start the server with our options
    await startServer({
      host: options.host,
      loadEnv: false, // Don't load .env files, we already set environment
    });
  } catch (error) {
    console.error("❌ Failed to start agent-service:", error);
    process.exit(1);
  }
}
