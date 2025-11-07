/**
 * Loader interface for loading configuration from different sources
 *
 * Usage:
 * 1. Implement this interface to create custom loaders
 * 2. Inject via ConfigManager.addLoader()
 * 3. Higher priority loaders override lower priority ones
 *
 * Example:
 * ```typescript
 * class DatabaseLoader implements Loader {
 *   priority = 20;  // Higher than EnvLoader (10)
 *
 *   async isAvailable() {
 *     return this.db.isConnected();
 *   }
 *
 *   async load() {
 *     return await this.db.getConfig();
 *   }
 * }
 *
 * configManager.addLoader(new DatabaseLoader(db));
 * ```
 */
export interface Loader {
  /**
   * Priority of this loader (higher priority wins during merge)
   *
   * Recommended values:
   * - 10: EnvLoader (default, built-in)
   * - 20: Database loaders
   * - 30: UI/Runtime loaders
   * - 40+: Custom high-priority loaders
   */
  priority: number;

  /**
   * Check if this loader is available in the current environment
   * @returns true if the loader can be used
   */
  isAvailable(): Promise<boolean>;

  /**
   * Load configuration from this source
   * @returns Configuration object or null if unavailable
   */
  load(): Promise<Record<string, unknown> | null>;
}
