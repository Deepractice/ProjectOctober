// Public API
export { createAgent } from "./api/agent";
export { SQLiteAgentPersister } from "./api";

// Types
export type {
  Agent,
  Session,
  AgentConfig,
  LoggerConfig,
  SessionOptions,
  AgentStatus,
  SessionState,
  SessionEvent,
  SessionMetadata,
  TokenUsage,
  AnyMessage,
  UserMessage,
  AgentMessage,
  ToolMessage,
  SystemMessage,
  ErrorMessage,
  PerformanceMetrics,
  ContentBlock,
  TextBlock,
  ImageBlock,
  AgentPersister,
} from "./types";
