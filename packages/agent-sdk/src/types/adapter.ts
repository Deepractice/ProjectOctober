import type { SessionOptions } from "./config";
import type { ContentBlock, AnyMessage, TokenUsageRaw } from "./message";

/**
 * Additional metadata that adapter can attach to domain messages
 */
export interface DomainMessageMetadata {
  /**
   * Optional updates to session options
   * Adapter can return options updates (e.g., resume token after extracting provider session ID)
   */
  updatedOptions?: Partial<SessionOptions>;

  /**
   * Token usage information (if available in this message)
   */
  usage?: TokenUsageRaw;
}

/**
 * Domain message returned by adapter
 * Combines our domain AnyMessage with optional metadata
 */
export type DomainMessage = AnyMessage & DomainMessageMetadata;

/**
 * Agent Adapter interface - abstracts AI provider
 *
 * Adapters are responsible for:
 * - Calling the AI provider's API
 * - Transforming provider messages to our domain types (AnyMessage)
 * - Managing provider-specific features (e.g., session resume, tool calling)
 * - Extracting and storing provider session IDs
 * - Returning session option updates when needed
 *
 * Design principle: Adapter handles ALL provider-specific logic.
 * Session layer should be completely provider-agnostic.
 */
export interface AgentAdapter {
  /**
   * Stream domain messages from AI model
   *
   * @param prompt - User prompt (string or multi-modal content)
   * @param options - Session options (may include resume session ID)
   * @returns AsyncGenerator of domain messages (already transformed to our types)
   */
  stream(prompt: string | ContentBlock[], options: SessionOptions): AsyncGenerator<DomainMessage>;

  /**
   * Get adapter name for logging and debugging
   */
  getName(): string;
}
