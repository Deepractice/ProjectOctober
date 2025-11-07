// Public API
export { createAgent } from "./api/agent";
export { createAgentPersister, SQLiteAgentPersister } from "./api";

// Config API (from agent-config)
export { getConfig, getConfigValue } from "./core/config/api/getConfig";
export { updateConfig, updateConfigFromUI } from "./core/config/api/updateConfig";
export { validateConfig, validateConfigValue } from "./core/config/api/validateConfig";

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
  MessagePersister,
} from "./types";

// Config types (from agent-config)
export type { Config, ConfigUpdate } from "./core/config/types/Config";
export type { ConfigSource, LoadOptions, UpdateOptions } from "./core/config/types/ConfigSource";
export type { ConfigManagerOptions } from "./core/config/ConfigManager";
