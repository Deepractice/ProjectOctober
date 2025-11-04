/**
 * Base interface for configuration loaders
 */
export interface Loader {
  /**
   * Load configuration from the source
   * Returns partial configuration or null if source not available
   */
  load(): Promise<Record<string, unknown> | null>;

  /**
   * Check if this loader's source is available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Priority of this loader (higher = higher priority)
   * Used when merging configurations from multiple sources
   */
  priority: number;
}
