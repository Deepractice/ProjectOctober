/**
 * WebSocket Message Types
 */

export type WebSocketMessageType =
  | 'session-created'
  | 'sessions_updated'
  | 'token-budget'
  | 'agent-response'
  | 'claude-output'
  | 'claude-interactive-prompt'
  | 'claude-error'
  | 'agent-complete'
  | 'session-aborted'
  | 'session-status'
  | 'claude-status';

export interface BaseWebSocketMessage {
  type: WebSocketMessageType;
  sessionId?: string;
  timestamp?: string | number;
}

export interface SessionCreatedMessage extends BaseWebSocketMessage {
  type: 'session-created';
  sessionId: string;
}

export interface SessionsUpdatedMessage extends BaseWebSocketMessage {
  type: 'sessions_updated';
  sessions: import('./session').Session[];
}

export interface AgentCompleteMessage extends BaseWebSocketMessage {
  type: 'agent-complete';
  sessionId: string;
  exitCode?: number;
}

export interface SessionAbortedMessage extends BaseWebSocketMessage {
  type: 'session-aborted';
  sessionId: string;
}

export interface SessionStatusMessage extends BaseWebSocketMessage {
  type: 'session-status';
  sessionId: string;
  isProcessing: boolean;
}

export interface AgentResponseMessage extends BaseWebSocketMessage {
  type: 'agent-response';
  sessionId: string;
  data?: any;
}

export interface AgentOutputMessage extends BaseWebSocketMessage {
  type: 'claude-output';
  sessionId: string;
  data?: any;
}

export interface AgentErrorMessage extends BaseWebSocketMessage {
  type: 'claude-error';
  sessionId: string;
  error?: string;
  data?: any;
}

export type WebSocketMessage =
  | SessionCreatedMessage
  | SessionsUpdatedMessage
  | AgentCompleteMessage
  | SessionAbortedMessage
  | SessionStatusMessage
  | AgentResponseMessage
  | AgentOutputMessage
  | AgentErrorMessage
  | BaseWebSocketMessage;

/**
 * Message Store State - Unified Message Management
 */
export interface MessageState {
  // Message routing (existing)
  recentMessages: (WebSocketMessage & { messageId: string })[];
  processedMessageIds: Set<string>;

  // Chat message storage - Single source of truth
  sessionMessages: Map<string, import('./chat').ChatMessage[]>;      // All messages
  loadingSessions: Set<string>;                                       // Loading indicators
  messageMetadata: Map<string, import('./chat').MessageMetadata>;    // Pagination metadata

  // Message routing actions (existing)
  handleMessage: (message: WebSocketMessage) => void;
  registerHandler: (type: WebSocketMessageType, handler: (message: any) => void) => void;
  unregisterHandler: (type: WebSocketMessageType) => void;
  clearMessages: () => void;
  getMessagesByType: (type: WebSocketMessageType) => WebSocketMessage[];
  getMessagesBySession: (sessionId: string) => WebSocketMessage[];

  // Unified chat message operations
  addUserMessage: (sessionId: string, content: string, images?: any[]) => void;
  addAssistantMessage: (sessionId: string, content: string) => void;
  addAssistantChunk: (sessionId: string, chunk: string) => void; // For streaming
  updateLastAssistantMessage: (sessionId: string, content: string) => void;
  addToolUse: (sessionId: string, toolName: string, toolInput: string, toolId: string) => void;
  updateToolResult: (sessionId: string, toolId: string, result: any) => void;
  addErrorMessage: (sessionId: string, error: string) => void;

  // Session lifecycle
  migrateSession: (oldSessionId: string, newSessionId: string) => void;
  clearSessionMessages: (sessionId: string) => void;

  // Legacy methods (for backward compatibility during migration)
  setServerMessages: (sessionId: string, messages: import('./chat').ChatMessage[]) => void;
  getDisplayMessages: (sessionId: string) => import('./chat').ChatMessage[];
  hasSessionMessages: (sessionId: string) => boolean;
  setLoading: (sessionId: string, loading: boolean) => void;
  setMetadata: (sessionId: string, metadata: import('./chat').MessageMetadata) => void;
}
