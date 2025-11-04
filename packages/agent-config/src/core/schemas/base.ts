import { z } from "zod";

/**
 * Base configuration schema
 * Defines all possible configuration options for the Agent project
 */
export const baseConfigSchema = z.object({
  // Server Configuration
  port: z.coerce.number().int().positive().default(5201),
  nodeEnv: z.enum(["development", "production", "test"]).default("development"),

  // Frontend Configuration
  vitePort: z.coerce.number().int().positive().default(5200),
  frontendUrl: z.string().url().default("http://localhost:5200"),

  // Anthropic API Configuration
  anthropicApiKey: z.string().min(1),
  anthropicBaseUrl: z.string().url().default("https://api.anthropic.com"),

  // Project Configuration
  projectPath: z.string().default("."),

  // Agent Configuration
  contextWindow: z.coerce.number().int().positive().default(160000),

  // Optional Features
  logLevel: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // Database (future)
  databasePath: z.string().optional(),
});

export type BaseConfig = z.infer<typeof baseConfigSchema>;
