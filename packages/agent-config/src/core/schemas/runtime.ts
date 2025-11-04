import { z } from "zod";
import { baseConfigSchema } from "./base.js";

/**
 * Runtime configuration schema
 * Strict validation for production runtime
 */
export const runtimeConfigSchema = baseConfigSchema.strict(); // No extra keys allowed

export type RuntimeConfig = z.infer<typeof runtimeConfigSchema>;
