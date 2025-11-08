/**
 * Error types re-exported from errors/base
 * This allows api/ layer to export error types without violating architecture rules
 */

export type { AgentError, AgentErrorCode } from "~/errors/base";
