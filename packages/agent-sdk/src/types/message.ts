export type MessageType = "user" | "assistant" | "tool" | "system";

// Content block types for multi-modal messages
export type ContentBlock = TextBlock | ImageBlock;

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ImageBlock {
  type: "image";
  source: {
    type: "base64";
    media_type: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
    data: string; // Base64 encoded image
  };
}

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
  content: string | ContentBlock[]; // Support both text and multi-content
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
