import { Loader } from "./Loader.js";

/**
 * Loads configuration from UI input (memory)
 * This is for runtime configuration updates from the web interface
 */
export class UILoader implements Loader {
  priority = 30; // Highest priority (user input overrides everything)
  private configCache: Record<string, unknown> | null = null;

  async isAvailable(): Promise<boolean> {
    return this.configCache !== null;
  }

  async load(): Promise<Record<string, unknown> | null> {
    return this.configCache;
  }

  /**
   * Set configuration from UI
   * This is called when user updates config through the web interface
   */
  setConfig(config: Record<string, unknown>): void {
    this.configCache = config;
  }

  /**
   * Clear cached configuration
   */
  clear(): void {
    this.configCache = null;
  }
}
