import "reflect-metadata";
import { container } from "tsyringe";
import type { Agent, AgentConfig, AgentDependencies } from "~/types";
import { ok, err, Result } from "neverthrow";
import { AgentError, AgentErrors } from "~/errors/base";
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
 * @returns Result<Agent, AgentError> - Ok with Agent or Err with typed error
 *
 * @example
 * ```typescript
 * import { createAgent, isOk, unwrap } from '@deepractice-ai/agent-sdk';
 *
 * // Using Result (recommended)
 * const result = createAgent({ workspace: '/path/to/project' });
 * if (isOk(result)) {
 *   const agent = result.value;
 *   await agent.initialize();
 * } else {
 *   console.error('Failed to create agent:', result.error);
 * }
 *
 * // Or unwrap (throws on error)
 * const agent = unwrap(createAgent({ workspace: '/path/to/project' }));
 *
 * // Custom adapter (via deps)
 * const result = createAgent(
 *   { workspace: '/path/to/project' },
 *   { adapter: new OpenAIAdapter(...) }
 * );
 * ```
 */
export function createAgent(
  config: AgentConfig,
  deps?: AgentDependencies
): Result<Agent, AgentError> {
  try {
    // Validate required config
    if (!config.apiKey) {
      return err(AgentErrors.configInvalid("apiKey is required"));
    }

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
    const persister = deps?.persister ?? new SQLiteAgentPersister(config.workspace, logger);
    container.register("AgentPersister", { useValue: persister });

    // Register factories and managers (auto-resolved by TSyringe)
    container.register(SessionFactory, { useClass: SessionFactory });
    container.register(SessionManager, { useClass: SessionManager });
    container.register(AgentCore, { useClass: AgentCore });

    // Resolve and return Agent
    const agent = container.resolve(AgentCore);
    return ok(agent);
  } catch (error) {
    // Convert to AgentError
    if (error instanceof AgentError) {
      return err(error);
    }
    return err(
      AgentErrors.unknown(error instanceof Error ? error.message : String(error), {
        originalError: error,
      })
    );
  }
}
