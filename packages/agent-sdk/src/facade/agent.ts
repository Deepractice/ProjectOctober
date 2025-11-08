import "reflect-metadata";
import { container } from "tsyringe";
import type { Agent, AgentConfig, AgentDependencies } from "~/types";
import { AgentCore } from "~/core/agent/Agent";
import { SessionFactory } from "~/core/session/SessionFactory";
import { SessionManager } from "~/core/agent/SessionManager";
import { ClaudeAdapter } from "~/adapters/claude/ClaudeAdapter";
import { SQLiteAgentPersister } from "~/persistence/sqlite/SQLiteAgentPersister";
import { createSDKLogger } from "~/utils/logger";

/**
 * Create a new Agent instance using DI
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
  // Clear existing registrations
  container.clearInstances();

  // Register config
  container.register("AgentConfig", { useValue: config });

  // Register logger
  const logger = deps?.logger ?? createSDKLogger(config.logger);
  container.register("Logger", { useValue: logger });

  // Register adapter (default: Claude)
  const adapter = deps?.adapter ?? new ClaudeAdapter(config, logger);
  container.register("AgentAdapter", { useValue: adapter });

  // Register persister (default: SQLite)
  const persister =
    deps?.persister ?? config.persister ?? new SQLiteAgentPersister(config.workspace, logger);
  container.register("AgentPersister", { useValue: persister });

  // Register factories and managers (auto-resolved by TSyringe)
  container.register(SessionFactory, { useClass: SessionFactory });
  container.register(SessionManager, { useClass: SessionManager });
  container.register(AgentCore, { useClass: AgentCore });

  // Resolve and return Agent
  return container.resolve(AgentCore);
}
