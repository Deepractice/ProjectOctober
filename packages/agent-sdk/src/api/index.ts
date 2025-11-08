/**
 * Agent SDK Public API
 * This is the main entry point for external consumers
 */

export { createAgent } from "./agent";

// Export persister utilities
export { SQLiteAgentPersister } from "~/persistence/sqlite";
export type { AgentPersister, SessionData } from "~/types/persister";

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
} from "~/types";
