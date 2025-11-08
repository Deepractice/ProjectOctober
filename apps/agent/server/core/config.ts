import config from "config";

/**
 * Application configuration interface
 * Matches the structure defined in config/*.json files
 */
export interface AppConfig {
  server: {
    port: number;
    nodeEnv: "development" | "production" | "test";
  };
  frontend: {
    vitePort: number;
    url: string;
  };
  anthropic: {
    apiKey: string;
    baseUrl: string;
  };
  project: {
    path: string;
  };
  agent: {
    contextWindow: number;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
  };
  database: {
    path: string | null;
  };
}

/**
 * Get typed configuration
 * Validates that all required fields are present
 */
export function getAppConfig(): AppConfig {
  // Validate required fields
  if (!config.has("anthropic.apiKey") || !config.get<string>("anthropic.apiKey")) {
    throw new Error("ANTHROPIC_API_KEY is required but not configured");
  }

  return {
    server: {
      port: config.get<number>("server.port"),
      nodeEnv: config.get<AppConfig["server"]["nodeEnv"]>("server.nodeEnv"),
    },
    frontend: {
      vitePort: config.get<number>("frontend.vitePort"),
      url: config.get<string>("frontend.url"),
    },
    anthropic: {
      apiKey: config.get<string>("anthropic.apiKey"),
      baseUrl: config.get<string>("anthropic.baseUrl"),
    },
    project: {
      path: config.get<string>("project.path"),
    },
    agent: {
      contextWindow: config.get<number>("agent.contextWindow"),
    },
    logging: {
      level: config.get<AppConfig["logging"]["level"]>("logging.level"),
    },
    database: {
      path: config.get<string | null>("database.path"),
    },
  };
}

/**
 * Get a specific config value with type safety
 */
export function getConfigValue<K extends keyof AppConfig>(key: K): AppConfig[K] {
  return config.get<AppConfig[K]>(key);
}
