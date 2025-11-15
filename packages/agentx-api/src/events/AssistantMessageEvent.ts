/**
 * Assistant Message Event
 *
 * Emitted when assistant completes a full response.
 * The message may contain text, thinking, and/or tool calls.
 *
 * Aligned with: SDKAssistantMessage from @anthropic-ai/claude-agent-sdk
 */

import type { AssistantMessage } from "@deepractice-ai/agentx-types";
import type { BaseAgentEvent } from "./BaseAgentEvent";

export interface AssistantMessageEvent extends BaseAgentEvent {
  type: "assistant";
  message: AssistantMessage;
}
