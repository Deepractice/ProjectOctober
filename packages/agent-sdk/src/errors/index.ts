/**
 * Error Handling System
 *
 * Provides Result type and typed errors for the Agent SDK
 */

// Re-export Result type from neverthrow
export { ok, err, Result, Ok, Err } from "neverthrow";
export type { ResultAsync } from "neverthrow";

// Error types
export * from "./base";
