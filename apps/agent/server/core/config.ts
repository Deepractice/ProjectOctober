/**
 * Application configuration interface
 * Reads from environment variables
 */
export interface AppConfig {
  port: number;
  nodeEnv: "development" | "production" | "test";
  anthropicApiKey: string;
  anthropicBaseUrl: string;
  projectPath: string;
}

/**
 * Get typed configuration from environment variables
 * Validates that all required fields are present
 */
export function getAppConfig(): AppConfig {
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN || "";
  const anthropicBaseUrl = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com";
  const port = parseInt(process.env.PORT || "5200", 10);
  const nodeEnv = (process.env.NODE_ENV || "development") as AppConfig["nodeEnv"];
  const projectPath = process.env.PROJECT_PATH || process.cwd();

  // Validate required fields
  if (!anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is required but not configured");
  }

  return {
    port,
    nodeEnv,
    anthropicApiKey,
    anthropicBaseUrl,
    projectPath,
  };
}
