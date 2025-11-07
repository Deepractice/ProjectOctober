import { z } from "zod";
import { baseConfigSchema } from "../schemas/base.js";

/**
 * Configuration type derived from schema
 */
export type Config = z.infer<typeof baseConfigSchema>;

/**
 * Partial configuration for updates
 */
export type ConfigUpdate = Partial<Config>;
