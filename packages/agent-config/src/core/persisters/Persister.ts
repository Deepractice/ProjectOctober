/**
 * Base interface for configuration persisters
 */
export interface Persister {
  /**
   * Persist configuration to the destination
   */
  persist(config: Record<string, unknown>): Promise<void>;

  /**
   * Check if this persister is available
   */
  isAvailable(): Promise<boolean>;
}
