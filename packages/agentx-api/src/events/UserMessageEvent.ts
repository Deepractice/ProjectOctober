/**
 * User Message Event
 *
 * Emitted when a user message is added to the conversation.
 * Aligned with: SDKUserMessage from @anthropic-ai/claude-agent-sdk
 */

import type { UserMessage } from "@deepractice-ai/agentx-types";
import type { BaseAgentEvent } from "./BaseAgentEvent";

export interface UserMessageEvent extends BaseAgentEvent {
  type: "user";
  message: UserMessage;
}
