/**
 * Central Type Definitions Export
 */

// Session types
export type { Session, SessionId, SessionState } from "./session";

// Re-export shared types from agent-types package
export type {
  // Message types
  ContentBlock,
  TextBlock,
  ImageBlock,
  MessageType,
  BaseMessage as BaseMessageType,
  UserMessage,
  AgentMessage,
  ToolResult,
  ToolMessage,
  SystemMessage,
  ErrorMessage,
  AnyMessage,
  ToolUse,
} from "@deepractice-ai/agent-types";

// Re-export event types from agent-types
export type {
  BaseEvent,
  SessionCreatedEvent,
  SessionUpdatedEvent,
  SessionProcessingEvent,
  SessionAbortedEvent,
  SessionCreateEvent,
  SessionEvent,
  MessageSendEvent,
  MessageUserEvent,
  MessageAgentEvent,
  MessageStreamingEvent,
  MessageCompleteEvent,
  MessageToolEvent,
  MessageToolResultEvent,
  MessageErrorEvent,
  MessageLoadedEvent,
  MessageEvent,
  AgentProcessingEvent,
  AgentCompleteEvent,
  AgentErrorEvent,
  AgentEvent,
  ErrorUnknownEvent,
  ErrorEvent,
  AnyEvent,
} from "@deepractice-ai/agent-types";

// Re-export WebSocket types from agent-types
export type {
  AgentCommandMessage,
  CreateSessionMessage,
  AbortSessionMessage,
  ClientMessage,
  SessionCreatedMessage,
  SessionsUpdatedMessage,
  AgentResponseMessage,
  ClaudeOutputMessage,
  ClaudeStatusMessage,
  ClaudeErrorMessage,
  AgentCompleteMessage,
  SessionAbortedMessage,
  SessionStatusMessage,
  ServerMessage,
  WebSocketMessage,
} from "@deepractice-ai/agent-types";

// Local WebSocket message types (for backward compatibility)
export type {
  WebSocketMessageType,
  BaseWebSocketMessage,
  AgentOutputMessage,
  AgentErrorMessage,
  MessageState,
} from "./message";

// Store types
export type { UIState, ConnectionState } from "./store";

// Chat types (UI-specific)
export type {
  ChatMessageType,
  BaseMessage,
  ChatMessage,
  MessageMetadata,
  ProjectInfo,
} from "./chat";

// Common types
export type {
  ApiResponse,
  SessionsResponse,
  BaseComponentProps,
  VoidFunction,
  AsyncVoidFunction,
  Nullable,
  Optional,
  Maybe,
} from "./common";

// Deprecated: kept for backward compatibility
export type { AgentMessage as AssistantMessage } from "@deepractice-ai/agent-types";
