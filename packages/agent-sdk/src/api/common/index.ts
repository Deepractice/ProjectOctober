/**
 * Core SDK API (no environment dependencies)
 * Safe for all environments: Node.js, Browser, Tests
 * No WebSocket Server dependencies (ws package)
 */

// Export facade functions
export { createAgent } from "~/facade/agent";

// Export Result type from neverthrow
export { ok, err, Result, Ok, Err } from "neverthrow";
export type { ResultAsync } from "neverthrow";

// Export error types (errors/ is at same level as facade/)
export { AgentError, AgentErrorCode, AgentErrors } from "~/errors/base";

// Export persister interface (for custom implementations)
export type { AgentPersister, SessionData } from "~/types/persister";

// Export adapter interface (for custom implementations)
export type { AgentAdapter } from "~/types/adapter";

// Re-export core types
export type {
  Agent,
  AgentConfig,
  AgentDependencies,
  Session,
  SessionCreateOptions,
  SessionOptions,
  AnyMessage,
  UserMessage,
  AgentMessage,
  ContentBlock,
  TextBlock,
  ImageBlock,
  MessageType,
  TokenUsageRaw,
} from "~/types";

// Export event types (for event-driven API)
export type {
  SessionEvents,
  AgentLevelEvents,
  SessionEventName,
  AgentEventName,
  AgentStateEvents,
  MessageEvents,
  StreamEvents,
  SessionLifecycleEvents,
  PersistenceEvents,
} from "~/types/events";
