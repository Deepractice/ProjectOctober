import type { Agent, AgentConfig, AgentDependencies } from "~/types";
import { AgentCore } from "~/core/agent";
import { ClaudeAdapter } from "~/adapters/claude/ClaudeAdapter";
import { SQLiteAgentPersister } from "~/persistence/sqlite/sqlite-persister";
import { createSDKLogger } from "~/utils/logger";

/**
 * Create a new Agent instance
 *
 * @param config - Agent configuration
 * @param deps - Optional dependency overrides (for testing or custom implementations)
 * @returns Agent instance
 *
 * @example
 * ```typescript
 * // Default usage (Claude + SQLite)
 * const agent = createAgent({
 *   workspace: '/path/to/project',
 *   model: 'claude-sonnet-4'
 * });
 *
 * // Custom persister (from config)
 * const agent = createAgent({
 *   workspace: '/path/to/project',
 *   persister: new CustomPersister(...)
 * });
 *
 * // Custom adapter (via deps)
 * const agent = createAgent(
 *   { workspace: '/path/to/project' },
 *   {
 *     adapter: new OpenAIAdapter(...)
 *   }
 * );
 *
 * // Testing with mocks
 * const agent = createAgent(
 *   { workspace: '/test' },
 *   {
 *     adapter: mockAdapter,
 *     persister: mockPersister,
 *   }
 * );
 *
 * await agent.initialize();
 * ```
 */
export function createAgent(config: AgentConfig, deps?: AgentDependencies): Agent {
  // Create logger
  const logger = deps?.logger ?? createSDKLogger(config.logger);

  // Create or use provided adapter (default: Claude)
  const adapter = deps?.adapter ?? new ClaudeAdapter(config, logger);

  // Create or use provided persister (default: SQLite)
  // Priority: deps.persister > config.persister > new SQLiteAgentPersister
  const persister =
    deps?.persister ?? config.persister ?? new SQLiteAgentPersister(config.workspace, logger);

  // Create AgentCore with all dependencies
  // Note: No SessionFactory needed - Session is now provider-agnostic
  return new AgentCore(config, adapter, persister, logger);
}
