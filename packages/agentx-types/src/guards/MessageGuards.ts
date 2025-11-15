import type { Message } from "~/message/Message";
import type { UserMessage } from "~/message/UserMessage";
import type { AssistantMessage } from "~/message/AssistantMessage";
import type { SystemMessage } from "~/message/SystemMessage";
import type { ToolMessage } from "~/message/ToolMessage";

/**
 * Type guard for UserMessage
 */
export function isUserMessage(message: Message): message is UserMessage {
  return message.role === "user";
}

/**
 * Type guard for AssistantMessage
 */
export function isAssistantMessage(message: Message): message is AssistantMessage {
  return message.role === "assistant";
}

/**
 * Type guard for SystemMessage
 */
export function isSystemMessage(message: Message): message is SystemMessage {
  return message.role === "system";
}

/**
 * Type guard for ToolMessage
 */
export function isToolMessage(message: Message): message is ToolMessage {
  return message.role === "tool";
}
