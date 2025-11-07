import { Loader } from "./Loader.js";

/**
 * Loads configuration from process.env
 *
 * NOTE: This loader does NOT handle .env file loading.
 * Environment files should be loaded by dotenv at application entry point.
 *
 * Responsibility:
 * - Read values from process.env (already populated by dotenv)
 * - Map environment variable names to config keys
 * - Return config object for validation
 *
 * File loading is handled by dotenv in the service entry point:
 * - .env.local (highest priority - local secrets and overrides)
 * - .env.[environment] (medium - development/test/production)
 * - .env (lowest - defaults)
 */
export class EnvLoader implements Loader {
  priority = 10; // Base priority

  async isAvailable(): Promise<boolean> {
    // Always available - process.env always exists
    return true;
  }

  async load(): Promise<Record<string, unknown> | null> {
    // Map environment variables to config keys
    // Values are already in process.env (loaded by dotenv)
    return {
      port: process.env.PORT,
      nodeEnv: process.env.NODE_ENV,
      vitePort: process.env.VITE_PORT,
      frontendUrl: process.env.FRONTEND_URL,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL,
      projectPath: process.env.PROJECT_PATH,
      contextWindow: process.env.CONTEXT_WINDOW,
      logLevel: process.env.LOG_LEVEL,
      databasePath: process.env.DATABASE_PATH,
    };
  }
}
