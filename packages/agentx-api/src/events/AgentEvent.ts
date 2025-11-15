/**
 * Agent Event
 *
 * Union of all agent event types.
 * Aligned with: SDKMessage from @anthropic-ai/claude-agent-sdk
 */

import type { UserMessageEvent } from "./UserMessageEvent";
import type { AssistantMessageEvent } from "./AssistantMessageEvent";
import type { StreamDeltaEvent } from "./StreamDeltaEvent";
import type { ResultEvent } from "./ResultEvent";
import type { SystemInitEvent } from "./SystemInitEvent";

/**
 * Union of all agent events
 */
export type AgentEvent =
  | UserMessageEvent
  | AssistantMessageEvent
  | StreamDeltaEvent
  | ResultEvent
  | SystemInitEvent;

/**
 * Event type discriminator
 */
export type EventType = AgentEvent["type"];

/**
 * Get event payload type by event type
 *
 * @example
 * type AssistantPayload = EventPayload<'assistant'>
 * // → AssistantMessageEvent
 */
export type EventPayload<T extends EventType> = Extract<AgentEvent, { type: T }>;
