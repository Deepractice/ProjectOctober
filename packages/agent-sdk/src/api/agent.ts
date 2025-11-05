import type { Agent, AgentConfig } from "~/types";
import { ClaudeAgent } from "~/core/claude-agent";

/**
 * Create a new Agent instance
 *
 * @param config - Agent configuration
 * @returns Agent instance
 *
 * @example
 * ```typescript
 * const agent = createAgent({
 *   workspace: '/path/to/project',
 *   warmupPoolSize: 3,
 *   model: 'claude-sonnet-4'
 * });
 *
 * await agent.initialize();
 * ```
 */
export function createAgent(config: AgentConfig): Agent {
  return new ClaudeAgent(config);
}
