import { z } from "zod";
import { Loader } from "./loaders/Loader.js";
import { Persister } from "./persisters/Persister.js";
import { EnvLoader } from "./loaders/EnvLoader.js";
import { UILoader } from "./loaders/UILoader.js";
import { DBLoader } from "./loaders/DBLoader.js";
import { developmentConfigSchema, runtimeConfigSchema } from "./schemas/index.js";

export type ConfigMode = "development" | "runtime";

export interface ConfigManagerOptions {
  mode?: ConfigMode;
  envPath?: string;
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
    this.initializeDefaultLoaders(options.envPath);
  }

  /**
   * Initialize default loaders (can be overridden for testing)
   */
  private initializeDefaultLoaders(envPath?: string): void {
    this.loaders = [new EnvLoader(envPath), new DBLoader(), new UILoader()];
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
   */
  async load(): Promise<Record<string, unknown>> {
    const configs: Record<string, unknown>[] = [];

    // Load from all available loaders
    for (const loader of this.loaders) {
      if (await loader.isAvailable()) {
        const config = await loader.load();
        if (config) {
          configs.push(config);
        }
      }
    }

    // Merge configurations (reverse order, so higher priority wins)
    const mergedConfig = configs.reverse().reduce((acc, config) => {
      return { ...acc, ...config };
    }, {});

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

  /**
   * Get the UILoader instance (for setting UI config)
   */
  getUILoader(): UILoader | undefined {
    return this.loaders.find((l) => l instanceof UILoader) as UILoader | undefined;
  }
}
