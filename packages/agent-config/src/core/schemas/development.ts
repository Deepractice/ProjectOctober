import { z } from "zod";
import { baseConfigSchema } from "./base.js";

/**
 * Development configuration schema
 * Relaxes some constraints for development convenience
 */
export const developmentConfigSchema = baseConfigSchema
  .extend({
    // Allow missing API key in development (will warn but not fail)
    anthropicApiKey: z.string().default(""),
  })
  .passthrough(); // Allow extra keys in development

export type DevelopmentConfig = z.infer<typeof developmentConfigSchema>;
