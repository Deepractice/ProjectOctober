/**
 * WebSocket Message Types
 */

export type WebSocketMessageType =
  | 'session-created'
  | 'sessions_updated'
  | 'token-budget'
  | 'claude-response'
  | 'claude-output'
  | 'claude-interactive-prompt'
  | 'claude-error'
  | 'claude-complete'
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

export interface ClaudeCompleteMessage extends BaseWebSocketMessage {
  type: 'claude-complete';
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

export interface ClaudeResponseMessage extends BaseWebSocketMessage {
  type: 'claude-response';
  sessionId: string;
  data?: any;
}

export interface ClaudeOutputMessage extends BaseWebSocketMessage {
  type: 'claude-output';
  sessionId: string;
  data?: any;
}

export interface ClaudeErrorMessage extends BaseWebSocketMessage {
  type: 'claude-error';
  sessionId: string;
  error?: string;
  data?: any;
}

export type WebSocketMessage =
  | SessionCreatedMessage
  | SessionsUpdatedMessage
  | ClaudeCompleteMessage
  | SessionAbortedMessage
  | SessionStatusMessage
  | ClaudeResponseMessage
  | ClaudeOutputMessage
  | ClaudeErrorMessage
  | BaseWebSocketMessage;

/**
 * Message Store State
 */
export interface MessageState {
  // State
  recentMessages: (WebSocketMessage & { messageId: string })[];
  processedMessageIds: Set<string>;

  // Actions
  handleMessage: (message: WebSocketMessage) => void;
  registerHandler: (type: WebSocketMessageType, handler: (message: any) => void) => void;
  unregisterHandler: (type: WebSocketMessageType) => void;
  clearMessages: () => void;
  getMessagesByType: (type: WebSocketMessageType) => WebSocketMessage[];
  getMessagesBySession: (sessionId: string) => WebSocketMessage[];
}
