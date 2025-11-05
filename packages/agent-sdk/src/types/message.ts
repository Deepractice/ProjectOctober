export type MessageType = "user" | "assistant" | "tool" | "system";

export interface ToolUse {
  id: string;
  name: string;
  input: unknown;
}

export interface BaseMessage {
  id: string;
  timestamp: Date;
  type: MessageType;
}

export interface UserMessage extends BaseMessage {
  type: "user";
  content: string;
}

export interface AssistantMessage extends BaseMessage {
  type: "assistant";
  content: string;
  thinking?: string;
  toolUses?: ToolUse[];
}

export interface ToolMessage extends BaseMessage {
  type: "tool";
  toolName: string;
  input: unknown;
  output: unknown;
  duration: number;
}

export interface SystemMessage extends BaseMessage {
  type: "system";
  subtype: string;
  data: unknown;
}

export type AnyMessage = UserMessage | AssistantMessage | ToolMessage | SystemMessage;
