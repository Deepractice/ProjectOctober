/**
 * Configuration Module
 * Centralized access to agent-config
 * Separated from index.js to avoid circular dependencies
 */
import { getConfig } from "@deepractice-ai/agent-config";

// Singleton config instance
let configInstance = null;

/**
 * Initialize and cache the configuration
 */
export async function initConfig() {
  if (!configInstance) {
    configInstance = await getConfig();
  }
  return configInstance;
}

/**
 * Get the cached configuration instance
 * Throws if not initialized
 */
export function config() {
  if (!configInstance) {
    throw new Error(
      "Configuration not initialized. Call initConfig() first."
    );
  }
  return configInstance;
}
