export interface AgentConfig {
  workspace: string;
  warmupPoolSize?: number;
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

export interface SessionOptions {
  resume?: string;
  model?: string;
  systemPrompt?: string;
}
