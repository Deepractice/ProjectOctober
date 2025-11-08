/**
 * Browser API - Thin layer
 * Forwards browser agent functionality from facade layer
 */

export {
  BrowserAgent,
  BrowserSession,
  createBrowserAgent,
  createBrowserSession,
} from "~/facade/browser";

// Re-export event types for browser usage
export type {
  SessionEvents,
  AgentStateEvents,
  MessageEvents,
  StreamEvents,
  SessionLifecycleEvents,
  PersistenceEvents,
} from "~/types/events";

// Re-export message types
export type { AnyMessage, UserMessage, AgentMessage, ContentBlock } from "~/types";
