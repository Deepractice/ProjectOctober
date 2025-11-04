import { config } from "dotenv";
import { resolve } from "path";
import { existsSync } from "fs";
import { Loader } from "./Loader.js";

/**
 * Loads configuration from .env file
 * Supports loading from monorepo root
 */
export class EnvLoader implements Loader {
  priority = 10; // Base priority
  private envPath: string;

  constructor(envPath?: string) {
    // Default to monorepo root .env
    this.envPath = envPath || resolve(process.cwd(), ".env");
  }

  async isAvailable(): Promise<boolean> {
    return existsSync(this.envPath);
  }

  async load(): Promise<Record<string, unknown> | null> {
    if (!(await this.isAvailable())) {
      return null;
    }

    // Load .env file
    const result = config({ path: this.envPath });

    if (result.error) {
      console.warn(`Failed to load .env from ${this.envPath}:`, result.error.message);
      return null;
    }

    // Map environment variables to config keys
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
