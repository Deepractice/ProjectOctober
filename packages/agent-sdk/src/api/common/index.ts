/**
 * Core SDK API (no environment dependencies)
 * Safe for all environments: Node.js, Browser, Tests
 * No WebSocket Server dependencies (ws package)
 */

import { createAgentSafe as createAgentInternal } from "~/facade/agent";
import type { Agent, AgentConfig, AgentDependencies } from "~/types";
import type { Result } from "neverthrow";
import type { AgentError } from "~/errors/base";

/**
 * Create a new Agent instance
 *
 * @param config - Agent configuration
 * @param options - Creation options
 * @returns Agent instance (throws on error) or Result<Agent, AgentError> (if safe: true)
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
 * // Safe mode (returns Result type)
 * const result = createAgent(
 *   { workspace: '/path/to/project', apiKey: 'key' },
 *   { safe: true }
 * );
 * if (result.isOk()) {
 *   const agent = result.value;
 *   await agent.initialize();
 * }
 *
 * // With custom dependencies
 * const agent = createAgent(
 *   { workspace: '/path/to/project', apiKey: 'key' },
 *   { adapter: new CustomAdapter() }
 * );
 * ```
 */
export function createAgent(
  config: AgentConfig,
  options?: AgentDependencies & { safe?: boolean }
): Agent | Result<Agent, AgentError> {
  const result = createAgentInternal(config, options);

  // If safe mode, return Result
  if (options?.safe) {
    return result;
  }

  // Otherwise, throw on error
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
