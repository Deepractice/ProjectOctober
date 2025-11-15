/**
 * Result Events
 *
 * Emitted when conversation completes (success or error).
 * Contains final statistics and usage information.
 *
 * Aligned with: SDKResultMessage from @anthropic-ai/claude-agent-sdk
 */

import type { TokenUsage } from "@deepractice-ai/agentx-types";
import type { BaseAgentEvent } from "./BaseAgentEvent";

/**
 * Result event - Success
 */
export interface ResultSuccessEvent extends BaseAgentEvent {
  type: "result";
  subtype: "success";
  durationMs: number;
  durationApiMs: number;
  numTurns: number;
  result: string;
  totalCostUsd: number;
  usage: TokenUsage;
}

/**
 * Result event - Error
 */
export interface ResultErrorEvent extends BaseAgentEvent {
  type: "result";
  subtype: "error_max_turns" | "error_during_execution";
  durationMs: number;
  durationApiMs: number;
  numTurns: number;
  totalCostUsd: number;
  usage: TokenUsage;
  error?: Error;
}

/**
 * Union of all result events
 */
export type ResultEvent = ResultSuccessEvent | ResultErrorEvent;
