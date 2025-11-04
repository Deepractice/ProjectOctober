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
 * This sets the UI loader cache with highest priority
 */
export async function updateConfigFromUI(updates: ConfigUpdate): Promise<Config> {
  const mgr = getManager();
  const uiLoader = mgr.getUILoader();

  if (!uiLoader) {
    throw new Error("UILoader not available");
  }

  // Set UI config (will override env and db)
  uiLoader.setConfig(updates as Record<string, unknown>);

  // Reload to apply changes
  return (await mgr.getConfig(true)) as Config;
}
