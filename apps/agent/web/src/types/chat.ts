/**
 * Chat Message Types (for UI rendering)
 */

// Content block types (aligned with SDK)
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

export type ChatMessageType = "user" | "assistant" | "error";

export interface BaseMessage {
  id: string; // Unique message ID (required - backend always provides this)
  type: ChatMessageType;
  content: string | ContentBlock[]; // Support both text and multi-content
  timestamp: Date | string;
  isOptimistic?: boolean; // Client-side pending message
}

export interface UserMessage extends BaseMessage {
  type: "user";
  content: string | ContentBlock[]; // Support both text and multi-content
  images?: string[]; // Deprecated: kept for backward compatibility
}

export interface ToolResult {
  content: string;
  isError: boolean;
  timestamp: Date;
  toolUseResult?: any;
}

export interface AssistantMessage extends BaseMessage {
  type: "assistant";
  content: string; // Assistant messages are always text for now
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
