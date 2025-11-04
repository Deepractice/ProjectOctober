import { ConfigManager, ConfigManagerOptions } from "../core/ConfigManager.js";
import type { Config } from "../types/Config.js";
import type { LoadOptions } from "../types/ConfigSource.js";

// Singleton instance
let manager: ConfigManager | null = null;
let managerOptions: ConfigManagerOptions | null = null;

function getManager(options?: ConfigManagerOptions): ConfigManager {
  // If options provided and different from cached, recreate manager
  if (options && (!manager || JSON.stringify(options) !== JSON.stringify(managerOptions))) {
    const mode =
      options.mode || (process.env.NODE_ENV === "production" ? "runtime" : "development");
    manager = new ConfigManager({ ...options, mode });
    managerOptions = options;
  }

  // Create default manager if not exists
  if (!manager) {
    const mode = process.env.NODE_ENV === "production" ? "runtime" : "development";
    manager = new ConfigManager({ mode });
    managerOptions = { mode };
  }

  return manager;
}

/**
 * Get current configuration
 * Loads from all available sources (env, db, ui) and merges them
 */
export async function getConfig(options: LoadOptions & ConfigManagerOptions = {}): Promise<Config> {
  const { reload, ...managerOpts } = options;
  const mgr = getManager(managerOpts);
  const config = await mgr.getConfig(reload);
  return config as Config;
}

/**
 * Get a specific config value
 */
export async function getConfigValue<K extends keyof Config>(key: K): Promise<Config[K]> {
  const config = await getConfig();
  return config[key];
}
