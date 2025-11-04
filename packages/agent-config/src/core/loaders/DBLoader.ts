import { Loader } from "./Loader.js";

/**
 * Loads configuration from database
 * Placeholder for future database integration
 */
export class DBLoader implements Loader {
  priority = 20; // Between env and UI

  async isAvailable(): Promise<boolean> {
    // TODO: Check if database is configured and accessible
    return false;
  }

  async load(): Promise<Record<string, unknown> | null> {
    // TODO: Implement database loading
    // Example: SELECT key, value FROM config
    return null;
  }
}
