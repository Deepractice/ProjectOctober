/**
 * Core SDK API (no environment dependencies)
 * Safe for all environments: Node.js, Browser, Tests
 * No WebSocket Server dependencies (ws package)
 */

import { createAgentSafe as createAgentInternal } from "~/facade/agent";
import type { Agent, AgentConfig, AgentDependencies } from "~/types";

/**
 * Create a new Agent instance
 *
 * @param config - Agent configuration
 * @param deps - Optional dependency overrides
 * @returns Agent instance
 * @throws {AgentError} - Throws if agent creation fails
 *
 * @example
 * ```typescript
 * import { createAgent } from '@deepractice-ai/agent-sdk';
 *
 * // Simple usage (throws on error)
 * const agent = createAgent({
 *   workspace: '/path/to/project',
 *   apiKey: process.env.ANTHROPIC_API_KEY!
 * });
 * await agent.initialize();
 *
 * // With custom dependencies
 * const agent = createAgent(
 *   { workspace: '/path/to/project', apiKey: 'key' },
 *   { adapter: new CustomAdapter() }
 * );
 * ```
 */
export function createAgent(config: AgentConfig, deps?: AgentDependencies): Agent {
  const result = createAgentInternal(config, deps);

  // Throw on error
  if (result.isErr()) {
    throw result.error;
  }
  return result.value;
}

// Export Result type from neverthrow
export { ok, err, Result, Ok, Err } from "neverthrow";
export type { ResultAsync } from "neverthrow";

// Re-export error types from facade (facade already exports from errors/)
export type { AgentError, AgentErrorCode } from "~/errors/base";

// Export persister interface (for custom implementations)
export type { AgentPersister, SessionData } from "~/types/persister";

// Export adapter interface (for custom implementations)
export type { AgentAdapter } from "~/types/adapter";

// Re-export core types
export type {
  Agent,
  AgentConfig,
  AgentDependencies,
  Session,
  SessionCreateOptions,
  SessionOptions,
  AnyMessage,
  UserMessage,
  AgentMessage,
  ContentBlock,
  TextBlock,
  ImageBlock,
  MessageType,
  TokenUsageRaw,
} from "~/types";

// Export event types (for event-driven API)
export type {
  SessionEvents,
  AgentLevelEvents,
  SessionEventName,
  AgentEventName,
  AgentStateEvents,
  MessageEvents,
  StreamEvents,
  SessionLifecycleEvents,
  PersistenceEvents,
} from "~/types/events";
