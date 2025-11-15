/**
 * Agent Configuration
 *
 * Complete configuration for creating an Agent instance.
 * Combines API credentials, LLM settings, and agent-specific configuration.
 */

import type { ApiConfig } from "./ApiConfig";
import type { LLMConfig } from "./LLMConfig";
import type { McpConfig } from "./McpConfig";

export interface AgentConfig extends ApiConfig, LLMConfig {
  /**
   * System prompt
   * Instructions that define the agent's behavior and capabilities
   */
  systemPrompt?: string;

  /**
   * MCP configuration
   * Configure Model Context Protocol servers for tool access
   */
  mcp?: McpConfig;
}
