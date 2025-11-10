/**
 * Browser-side API
 * Includes WebSocket Bridge for browser WebSocket connections
 * No Node.js specific dependencies
 */

// Re-export only type-safe exports from common (no Node.js dependencies)
export { ok, err, Result, Ok, Err } from "neverthrow";
export type { ResultAsync } from "neverthrow";
export type { AgentError, AgentErrorCode } from "~/types/error";
export type { AgentPersister, SessionData } from "~/types/persister";
export type { AgentAdapter } from "~/types/adapter";
export type {
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

// Browser-specific: WebSocket Bridge (for browser WebSocket)
// Import directly from core to avoid pulling in ws dependency
export { WebSocketBridge } from "~/core/websocket/WebSocketBridge";
export type { WebSocketLike } from "~/core/websocket/WebSocketBridge";

// Browser-specific: Browser Agent (for browser environment)
export {
  createBrowserAgent,
  createBrowserSession,
  BrowserAgent,
  BrowserSession,
} from "~/facade/browser";
