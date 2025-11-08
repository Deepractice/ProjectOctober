export interface AgentConfig {
  workspace: string;
  apiKey: string; // Anthropic API key (required)
  baseUrl?: string; // Optional: custom API endpoint
  model?: string; // Default model
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
  model?: string;
  systemPrompt?: string;
  resume?: string; // Provider session ID for resuming
  temperature?: number;
  maxTokens?: number;
}
