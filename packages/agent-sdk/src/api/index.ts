/**
 * Agent SDK Public API
 * This is the main entry point for external consumers
 */

import { SQLiteAgentPersister } from "~/core/persistence/sqlite-persister";
import type { AgentPersister } from "~/types/persister";
import type { Logger } from "@deepracticex/logger";

/**
 * Create default agent persister (SQLite implementation)
 *
 * @param workspace - Workspace directory (where .agentx will be created)
 * @param logger - Logger instance
 * @returns AgentPersister instance
 *
 * @example
 * ```typescript
 * import { createAgentPersister } from '@deepractice-ai/agent-sdk';
 *
 * const persister = createAgentPersister('/path/to/workspace', logger);
 * await persister.messages.saveMessage(sessionId, message);
 * ```
 */
export function createAgentPersister(workspace: string, logger: Logger): AgentPersister {
  return new SQLiteAgentPersister(workspace, logger);
}

/**
 * Export SQLiteAgentPersister for advanced usage
 * Allows users to customize database path or options
 *
 * @example
 * ```typescript
 * import { SQLiteAgentPersister } from '@deepractice-ai/agent-sdk';
 *
 * const persister = new SQLiteAgentPersister(workspace, logger, {
 *   dbPath: '.agentx/custom.db'
 * });
 * ```
 */
export { SQLiteAgentPersister } from "~/core/persistence/sqlite-persister";
