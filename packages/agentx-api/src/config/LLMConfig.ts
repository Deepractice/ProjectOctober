/**
 * LLM Configuration
 *
 * Parameters that control how the language model generates responses.
 * These are standard parameters supported by most LLM providers.
 */

export interface LLMConfig {
  /**
   * Model identifier to use for inference
   * @example "claude-3-5-sonnet-20241022"
   */
  model: string;

  /**
   * Sampling temperature (0-2)
   * Higher values make output more random, lower values more deterministic
   * @default 1.0
   */
  temperature?: number;

  /**
   * Maximum number of tokens to generate
   */
  maxTokens?: number;

  /**
   * Top-p sampling (nucleus sampling)
   * Range: 0-1
   */
  topP?: number;

  /**
   * Top-k sampling
   * Only consider the top k tokens
   */
  topK?: number;

  /**
   * Presence penalty (-2.0 to 2.0)
   * Penalize tokens that have already appeared
   */
  presencePenalty?: number;

  /**
   * Frequency penalty (-2.0 to 2.0)
   * Penalize tokens based on their frequency
   */
  frequencyPenalty?: number;

  /**
   * Stop sequences
   * Generation stops when any of these sequences is encountered
   */
  stopSequences?: string[];

  /**
   * Maximum number of thinking tokens (for models with extended thinking)
   */
  maxThinkingTokens?: number;
}
