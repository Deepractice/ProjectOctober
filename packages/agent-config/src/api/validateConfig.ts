import { z } from "zod";
import { baseConfigSchema } from "../core/schemas/base.js";
import type { ConfigUpdate } from "../types/Config.js";

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors?: Array<{ path: string; message: string }>;
}

/**
 * Validate configuration against schema
 * Returns validation result without throwing
 */
export function validateConfig(config: ConfigUpdate): ValidationResult {
  try {
    baseConfigSchema.parse(config);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
        })),
      };
    }
    return {
      valid: false,
      errors: [{ path: "", message: "Unknown validation error" }],
    };
  }
}

/**
 * Validate a specific config value
 */
export function validateConfigValue<T>(
  key: string,
  value: T,
  schema: z.ZodType<T>
): ValidationResult {
  try {
    schema.parse(value);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map((err) => ({
          path: key,
          message: err.message,
        })),
      };
    }
    return {
      valid: false,
      errors: [{ path: key, message: "Unknown validation error" }],
    };
  }
}
