export interface AgentConfig {
  workspace: string;
  model?: string;
  mcpServers?: Record<string, McpServerConfig>;
  logger?: LoggerConfig;
}

export interface LoggerConfig {
  level?: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
  console?: boolean;
  file?: {
    dirname: string;
  };
  colors?: boolean;
}

export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

// SDK-specific session options (extends shared SessionOptions)
import type { SessionOptions as BaseSessionOptions } from "@deepractice-ai/agent-types";

export interface SessionOptions extends BaseSessionOptions {
  model?: string;
  systemPrompt?: string;
}
