/**
 * Agent Errors
 *
 * Error classes for AgentX ecosystem.
 *
 * Note: Runtime errors (API errors, network errors, etc.) are delivered
 * through the 'result' event with error subtypes, not thrown exceptions.
 */

export { AgentConfigError } from "./AgentConfigError";
export { AgentAbortError } from "./AgentAbortError";
