/**
 * Configuration source types
 */
export type ConfigSource = "env" | "db" | "ui" | "file";

/**
 * Options for loading configuration
 */
export interface LoadOptions {
  /**
   * Specific source to load from (defaults to all)
   */
  source?: ConfigSource;

  /**
   * Force reload even if cached
   */
  reload?: boolean;
}

/**
 * Options for updating configuration
 */
export interface UpdateOptions {
  /**
   * Persist the changes
   */
  persist?: boolean;

  /**
   * Target persister ('db' | 'file')
   */
  persistTo?: "db" | "file";
}
