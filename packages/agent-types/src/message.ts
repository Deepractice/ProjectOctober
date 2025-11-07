/**
 * Message Types - Shared across SDK, Frontend, and Backend
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
// Message Type Enums
// ============================================================================

export type MessageType = "user" | "agent" | "tool" | "system" | "error";

// ============================================================================
// Base Message Interface
// ============================================================================

export interface BaseMessage {
  id: string;
  type: MessageType;
  timestamp: Date | string;
}

// ============================================================================
// User Message
// ============================================================================

export interface UserMessage extends BaseMessage {
  type: "user";
  content: string | ContentBlock[]; // Support both text-only and multi-modal
}

// ============================================================================
// Agent Message (formerly AssistantMessage)
// ============================================================================

export interface AgentMessage extends BaseMessage {
  type: "agent";
  content: string; // Agent messages are always text (for now)

  // Tool use fields
  isToolUse?: boolean;
  toolName?: string;
  toolInput?: string;
  toolId?: string;
  toolResult?: ToolResult | null;

  // Streaming state
  isStreaming?: boolean;

  // Extended thinking
  reasoning?: string;
  thinking?: string;
}

// ============================================================================
// Tool Result
// ============================================================================

export interface ToolResult {
  content: string;
  isError: boolean;
  timestamp: Date | string;
  toolUseResult?: unknown;
}

// ============================================================================
// Tool Message
// ============================================================================

export interface ToolMessage extends BaseMessage {
  type: "tool";
  toolName: string;
  toolId: string;
  input: unknown;
  output: unknown;
  duration?: number;
}

// ============================================================================
// System Message
// ============================================================================

export interface SystemMessage extends BaseMessage {
  type: "system";
  subtype: string;
  data: unknown;
}

// ============================================================================
// Error Message
// ============================================================================

export interface ErrorMessage extends BaseMessage {
  type: "error";
  content: string;
  error?: string;
}

// ============================================================================
// Union Type
// ============================================================================

export type AnyMessage = UserMessage | AgentMessage | ToolMessage | SystemMessage | ErrorMessage;

// ============================================================================
// Tool Use (for assistant messages with tools)
// ============================================================================

export interface ToolUse {
  id: string;
  name: string;
  input: unknown;
}
