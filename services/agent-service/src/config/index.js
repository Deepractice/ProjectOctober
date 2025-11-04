/**
 * Configuration singleton for agent-service
 * Loads config from @deepractice-ai/agent-config and provides sync access
 */
import { getConfig } from "@deepractice-ai/agent-config";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let configInstance = null;

/**
 * Initialize configuration
 * Must be called before accessing config
 * @param {Object} options - Configuration options
 * @param {string} options.envPath - Path to .env file (defaults to monorepo root)
 */
export async function initConfig(options = {}) {
  if (!configInstance) {
    // Default to monorepo root .env
    const envPath = options.envPath || resolve(__dirname, "../../../.env");

    configInstance = await getConfig({ envPath });
    console.log("✅ Configuration loaded from:", envPath);
  }
  return configInstance;
}

/**
 * Get configuration (sync)
 * Throws if config not initialized
 */
export function config() {
  if (!configInstance) {
    throw new Error("Configuration not initialized. Call initConfig() first.");
  }
  return configInstance;
}

/**
 * Helper: get a specific config value
 */
export function getConfigValue(key) {
  return config()[key];
}
