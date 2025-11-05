/**
 * Chat Message Types (for UI rendering)
 */

export type ChatMessageType = "user" | "assistant" | "error";

export interface BaseMessage {
  id?: string; // Unique message ID
  type: ChatMessageType;
  content: string;
  timestamp: Date | string;
  isOptimistic?: boolean; // Client-side pending message
}

export interface UserMessage extends BaseMessage {
  type: "user";
  images?: string[];
}

export interface ToolResult {
  content: string;
  isError: boolean;
  timestamp: Date;
  toolUseResult?: any;
}

export interface AssistantMessage extends BaseMessage {
  type: "assistant";
  isToolUse?: boolean;
  toolName?: string;
  toolInput?: string;
  toolId?: string; // Tool use ID for matching results
  toolResult?: ToolResult | null;
  isStreaming?: boolean;
  reasoning?: string;
}

export interface ErrorMessage extends BaseMessage {
  type: "error";
  error?: string;
}

export type ChatMessage = UserMessage | AssistantMessage | ErrorMessage;

/**
 * Message Metadata (for pagination and caching)
 */
export interface MessageMetadata {
  hasMore: boolean; // Has more messages to load
  offset: number; // Current pagination offset
  total: number; // Total message count
  lastLoadedAt: number; // Cache timestamp
}

/**
 * Project Info
 */
export interface ProjectInfo {
  name: string;
  path: string;
  fullPath: string;
}
