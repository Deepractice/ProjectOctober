/**
 * MCP Configuration
 *
 * Configuration for Model Context Protocol servers.
 * Defines how to connect to and configure MCP servers.
 */

/**
 * Stdio Transport Configuration
 *
 * Connect to MCP server via standard input/output (spawned process).
 */
export interface McpStdioTransport {
  type: "stdio";
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

/**
 * SSE Transport Configuration
 *
 * Connect to MCP server via Server-Sent Events.
 */
export interface McpSseTransport {
  type: "sse";
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * HTTP Transport Configuration
 *
 * Connect to MCP server via HTTP requests.
 */
export interface McpHttpTransport {
  type: "http";
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * SDK Transport Configuration
 *
 * Use an in-process MCP server instance.
 */
export interface McpSdkTransport {
  type: "sdk";
  name: string;
  instance: unknown;
}

/**
 * MCP Transport Config
 *
 * Union of all transport configuration types.
 */
export type McpTransportConfig =
  | McpStdioTransport
  | McpSseTransport
  | McpHttpTransport
  | McpSdkTransport;

/**
 * MCP Server Configuration
 *
 * Configuration for a single MCP server.
 */
export interface McpServerConfig {
  /** Server name */
  name: string;

  /** Transport configuration */
  transport: McpTransportConfig;

  /** Whether to enable this server */
  enabled?: boolean;

  /** Server initialization timeout in milliseconds */
  timeout?: number;
}

/**
 * MCP Configuration
 *
 * Configuration for all MCP servers used by the agent.
 */
export interface McpConfig {
  /** MCP servers keyed by name */
  servers: Record<string, McpServerConfig>;

  /** Whether to enable MCP support */
  enabled?: boolean;
}
