/**
 * Stream Delta Event
 *
 * Emitted during streaming for incremental content.
 * Only emitted when streaming is enabled.
 *
 * Aligned with: SDKPartialAssistantMessage from @anthropic-ai/claude-agent-sdk
 */

import type { BaseAgentEvent } from "./BaseAgentEvent";

/**
 * Stream event types from Anthropic SDK
 */
export type StreamEventType =
  | "message_start"
  | "content_block_start"
  | "content_block_delta"
  | "content_block_stop"
  | "message_delta"
  | "message_stop";

/**
 * Content block delta types
 */
export type ContentBlockDelta =
  | { type: "text_delta"; text: string }
  | { type: "input_json_delta"; partial_json: string };

export interface StreamDeltaEvent extends BaseAgentEvent {
  type: "stream_event";
  streamEventType: StreamEventType;
  delta?: ContentBlockDelta;
  index?: number;
}
