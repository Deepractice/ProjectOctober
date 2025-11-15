import type { UserMessage } from "./UserMessage";
import type { AssistantMessage } from "./AssistantMessage";
import type { SystemMessage } from "./SystemMessage";
import type { ToolMessage } from "./ToolMessage";

/**
 * Message
 *
 * Discriminated union of all message types based on role.
 * Use the `role` field to determine the actual message type.
 *
 * @example
 * ```typescript
 * function handleMessage(msg: Message) {
 *   if (msg.role === "user") {
 *     // TypeScript knows msg is UserMessage
 *     const content = msg.content  // string | Part[]
 *   }
 * }
 * ```
 */
export type Message = UserMessage | AssistantMessage | SystemMessage | ToolMessage;
