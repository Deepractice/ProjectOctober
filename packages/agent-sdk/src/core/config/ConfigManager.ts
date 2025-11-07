import { z } from "zod";
import { Loader } from "./loaders/Loader.js";
import { Persister } from "./persisters/Persister.js";
import { EnvLoader } from "./loaders/EnvLoader.js";
import { developmentConfigSchema, runtimeConfigSchema } from "./schemas/index.js";

export type ConfigMode = "development" | "runtime";

export interface ConfigManagerOptions {
  mode?: ConfigMode;
  // envPath is deprecated - dotenv handles file loading at service entry point
}

/**
 * ConfigManager orchestrates loading, validation, and persistence of configuration
 * Implements the strategy pattern for multi-source configuration loading
 */
export class ConfigManager {
  private loaders: Loader[] = [];
  private persisters: Persister[] = [];
  private cachedConfig: Record<string, unknown> | null = null;
  private mode: ConfigMode;

  constructor(options: ConfigManagerOptions = {}) {
    this.mode = options.mode || "development";
    this.initializeDefaultLoaders();
  }

  /**
   * Initialize default loaders
   */
  private initializeDefaultLoaders(): void {
    // EnvLoader reads from process.env (dotenv handles file loading at service entry)
    this.loaders = [new EnvLoader()];
  }

  /**
   * Add a custom loader
   */
  addLoader(loader: Loader): void {
    this.loaders.push(loader);
    // Sort by priority (higher priority first)
    this.loaders.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Add a persister
   */
  addPersister(persister: Persister): void {
    this.persisters.push(persister);
  }

  /**
   * Load configuration from all available sources
   * Higher priority loaders override lower priority ones
   *
   * Current implementation:
   * - EnvLoader (priority: 10) - reads from process.env
   *
   * Future: Can add custom loaders via addLoader() for database, UI, etc.
   */
  async load(): Promise<Record<string, unknown>> {
    // Load from all loaders and collect their configs
    const loadedConfigs: Array<{ priority: number; config: Record<string, unknown> }> = [];

    for (const loader of this.loaders) {
      if (await loader.isAvailable()) {
        const config = await loader.load();
        if (config) {
          loadedConfigs.push({ priority: loader.priority, config });
        }
      }
    }

    // Sort by priority (ascending: lowest to highest)
    // This ensures that when we merge, higher priority configs overwrite lower ones
    loadedConfigs.sort((a, b) => a.priority - b.priority);

    // Merge configurations: higher priority overwrites lower priority
    // Example: { ...envConfig, ...dbConfig, ...uiConfig }
    // Result: uiConfig values win, then dbConfig, then envConfig
    const mergedConfig = loadedConfigs.reduce(
      (acc, { config }) => {
        return { ...acc, ...config };
      },
      {} as Record<string, unknown>
    );

    // Validate against schema
    const validatedConfig = this.validate(mergedConfig);

    // Cache the config
    this.cachedConfig = validatedConfig;

    return validatedConfig;
  }

  /**
   * Validate configuration against schema
   */
  private validate(config: Record<string, unknown>): Record<string, unknown> {
    const schema = this.mode === "development" ? developmentConfigSchema : runtimeConfigSchema;

    try {
      const validated = schema.parse(config);
      return validated as Record<string, unknown>;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Configuration validation failed:");
        error.errors.forEach((err) => {
          console.error(`  - ${err.path.join(".")}: ${err.message}`);
        });
        throw new Error("Invalid configuration");
      }
      throw error;
    }
  }

  /**
   * Get current configuration (from cache or reload)
   */
  async getConfig(reload = false): Promise<Record<string, unknown>> {
    if (!reload && this.cachedConfig) {
      return this.cachedConfig;
    }
    return await this.load();
  }

  /**
   * Update configuration and optionally persist
   */
  async updateConfig(
    updates: Partial<Record<string, unknown>>,
    options: { persist?: boolean } = {}
  ): Promise<Record<string, unknown>> {
    // Merge with current config
    const currentConfig = await this.getConfig();
    const newConfig = { ...currentConfig, ...updates };

    // Validate
    const validatedConfig = this.validate(newConfig);

    // Update cache
    this.cachedConfig = validatedConfig;

    // Persist if requested
    if (options.persist) {
      await this.persist(validatedConfig);
    }

    return validatedConfig;
  }

  /**
   * Persist configuration to all available persisters
   */
  private async persist(config: Record<string, unknown>): Promise<void> {
    const promises = this.persisters.filter((p) => p.isAvailable()).map((p) => p.persist(config));

    await Promise.all(promises);
  }

  /**
   * Clear cached configuration
   */
  clearCache(): void {
    this.cachedConfig = null;
  }
}
