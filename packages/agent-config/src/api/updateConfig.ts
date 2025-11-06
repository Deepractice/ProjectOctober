import { ConfigManager, ConfigManagerOptions } from "../core/ConfigManager.js";
import type { Config, ConfigUpdate } from "../types/Config.js";
import type { UpdateOptions } from "../types/ConfigSource.js";
import { DBPersister } from "../core/persisters/DBPersister.js";
import { FilePersister } from "../core/persisters/FilePersister.js";

// Singleton instance (shared with getConfig)
let manager: ConfigManager | null = null;

function getManager(options?: ConfigManagerOptions): ConfigManager {
  if (!manager) {
    const mode =
      options?.mode || (process.env.NODE_ENV === "production" ? "runtime" : "development");
    manager = new ConfigManager({ ...options, mode });

    // Add persisters
    manager.addPersister(new DBPersister());
    manager.addPersister(new FilePersister());
  }
  return manager;
}

/**
 * Update configuration
 * Optionally persist changes to database or file
 */
export async function updateConfig(
  updates: ConfigUpdate,
  options: UpdateOptions = {}
): Promise<Config> {
  const mgr = getManager();
  const config = await mgr.updateConfig(updates, options);
  return config as Config;
}

/**
 * Update configuration from UI
 * Currently not supported - UILoader has been removed
 * Use updateConfig() with persist option instead
 *
 * @deprecated Use updateConfig(updates, { persist: true }) instead
 */
export async function updateConfigFromUI(_updates: ConfigUpdate): Promise<Config> {
  throw new Error(
    "updateConfigFromUI is not supported. UILoader has been removed. " +
      "Use updateConfig(updates, { persist: true }) instead."
  );
}
