/**
 * Agent SDK Public API
 * This is the main entry point for external consumers
 */

export { createAgent } from "./agent";

// Export Result type from neverthrow
export { ok, err, Result, Ok, Err } from "neverthrow";
export type { ResultAsync } from "neverthrow";

// Export error types
export { AgentError, AgentErrorCode, AgentErrors } from "~/errors/base";

// Export persister interface (for custom implementations)
export type { AgentPersister, SessionData } from "~/types/persister";

// Export WebSocket server (for server-side)
export { createWebSocketServer, WebSocketBridge } from "./websocket";
export type { WebSocketLike } from "./websocket";

// Re-export key types
export type {
  Agent,
  AgentConfig,
  Session,
  SessionCreateOptions,
  SessionOptions,
  AnyMessage,
  UserMessage,
  AgentMessage,
  AgentAdapter,
  WebSocketServerConfig,
  AgentWebSocketServer,
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
