/**
 * Chat Message Types (for UI rendering)
 */

export type ChatMessageType = 'user' | 'assistant' | 'error';

export interface BaseMessage {
  type: ChatMessageType;
  content: string;
  timestamp: Date | string;
}

export interface UserMessage extends BaseMessage {
  type: 'user';
  images?: string[];
}

export interface ToolResult {
  content: string;
  isError: boolean;
  timestamp: Date;
  toolUseResult?: any;
}

export interface AssistantMessage extends BaseMessage {
  type: 'assistant';
  isToolUse?: boolean;
  toolName?: string;
  toolInput?: string;
  toolResult?: ToolResult | null;
  isStreaming?: boolean;
  reasoning?: string;
}

export interface ErrorMessage extends BaseMessage {
  type: 'error';
  error?: string;
}

export type ChatMessage = UserMessage | AssistantMessage | ErrorMessage;

/**
 * Project Info
 */
export interface ProjectInfo {
  name: string;
  path: string;
  fullPath: string;
}
