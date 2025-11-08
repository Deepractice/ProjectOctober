/**
 * Message Types - Agent SDK Standard
 *
 * This defines the canonical message format for agent-sdk.
 * All adapters must transform their provider-specific messages to this format.
 */

// ============================================================================
// Content Block Types (Multi-modal support)
// ============================================================================

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
    data: string; // Base64 encoded image data
  };
}

// ============================================================================
// Message Types
// ============================================================================

export type MessageType = "user" | "agent";

export interface BaseMessage {
  id: string;
  type: MessageType;
  timestamp: Date;
}

// ============================================================================
// User Message
// ============================================================================

export interface UserMessage extends BaseMessage {
  type: "user";
  content: string | ContentBlock[]; // Support both text-only and multi-modal
}

// ============================================================================
// Agent Message
// ============================================================================

export interface AgentMessage extends BaseMessage {
  type: "agent";
  content: string;

  // Tool use fields
  isToolUse?: boolean;
  toolName?: string;
  toolInput?: string;
  toolId?: string;

  // Token usage (attached by adapter)
  usage?: TokenUsageRaw;
}

// ============================================================================
// Union Type
// ============================================================================

export type AnyMessage = UserMessage | AgentMessage;

// ============================================================================
// Token Usage (raw format from provider)
// ============================================================================

export interface TokenUsageRaw {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
}
