import type { SessionOptions } from "./config";
import type { ContentBlock } from "@deepractice-ai/agent-types";

/**
 * Token usage from AI provider (raw format)
 */
export interface TokenUsageRaw {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}

/**
 * Generic message from AI adapter
 * Adapters transform provider-specific messages to this generic format
 */
export interface AdapterMessage {
  /**
   * Message type
   */
  type: "user" | "assistant" | "system" | "result";

  /**
   * Session ID from provider (if available)
   * Some providers (like Claude SDK) return session_id in the stream
   */
  sessionId?: string;

  /**
   * Message content (provider-specific format)
   */
  content?: any;

  /**
   * Token usage information
   */
  usage?: TokenUsageRaw;

  /**
   * Message UUID (if provided by provider)
   */
  uuid?: string;

  /**
   * Raw message from provider (for debugging and provider-specific handling)
   */
  raw?: unknown;
}

/**
 * Agent Adapter interface - abstracts AI provider
 *
 * Adapters are responsible for:
 * - Calling the AI provider's API
 * - Streaming messages back
 * - Transforming provider-specific messages to AdapterMessage format
 *
 * What adapters DON'T do:
 * - Session management (handled by Session layer)
 * - Message persistence (handled by Persister)
 * - Message transformation to our domain types (handled by Session layer)
 */
export interface AgentAdapter {
  /**
   * Stream messages from AI model
   *
   * @param prompt - User prompt (string or multi-modal content)
   * @param options - Session options (may include resume session ID)
   * @returns AsyncGenerator of adapter messages
   */
  stream(prompt: string | ContentBlock[], options: SessionOptions): AsyncGenerator<AdapterMessage>;

  /**
   * Get adapter name for logging and debugging
   */
  getName(): string;
}
