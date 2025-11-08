import type {
  AnyMessage,
  UserMessage,
  AgentMessage,
  ToolMessage,
} from "@deepractice-ai/agent-types";

export interface PerformanceMetrics {
  avgResponseTime: number;
  totalSessions: number;
  cacheHitRate: number;
}

export interface AgentStatus {
  ready: boolean;
  warmupPoolSize: number;
  activeSessions: number;
  metrics: PerformanceMetrics;
}

/**
 * Legacy session event (kept for backward compatibility)
 */
export type SessionEvent =
  | { type: "created"; sessionId: string }
  | { type: "updated"; sessionId: string }
  | { type: "deleted"; sessionId: string };

/**
 * Agent state events (AI working state changes)
 */
export interface AgentStateEvents {
  "agent:idle": { timestamp: Date };
  "agent:thinking": { timestamp: Date };
  "agent:speaking": { message: AnyMessage; chunk?: string };
  "agent:tool_calling": { toolName: string; toolId: string; input: any };
  "agent:tool_waiting": { toolId: string };
  "agent:error": { error: Error };
  "agent:completed": { timestamp: Date };
}

/**
 * Message events
 */
export interface MessageEvents {
  "message:user": { message: UserMessage };
  "message:agent": { message: AgentMessage };
  "message:tool": { message: ToolMessage };
}

/**
 * Stream events
 */
export interface StreamEvents {
  "stream:start": { timestamp: Date };
  "stream:chunk": { chunk: string; index: number };
  "stream:end": { timestamp: Date; totalChunks: number };
}

/**
 * Session lifecycle events
 */
export interface SessionLifecycleEvents {
  "session:created": { sessionId: string; timestamp: Date };
  "session:active": { sessionId: string; timestamp: Date };
  "session:idle": { sessionId: string; timestamp: Date };
  "session:completed": { sessionId: string; timestamp: Date };
  "session:error": { sessionId: string; error: Error; timestamp: Date };
  "session:deleted": { sessionId: string; timestamp: Date };
}

/**
 * Persistence events
 */
export interface PersistenceEvents {
  "persist:message:start": { messageId: string; sessionId: string };
  "persist:message:success": { messageId: string; sessionId: string };
  "persist:message:error": { messageId: string; sessionId: string; error: Error };
  "persist:session:start": { sessionId: string };
  "persist:session:success": { sessionId: string };
  "persist:session:error": { sessionId: string; error: Error };
}

/**
 * All session events combined (for EventEmitter)
 */
export type SessionEvents = AgentStateEvents &
  MessageEvents &
  StreamEvents &
  SessionLifecycleEvents &
  PersistenceEvents;

/**
 * Agent-level events (aggregated from all sessions)
 */
export interface AgentLevelEvents extends SessionEvents {
  "agent:initialized": { sessionCount: number; timestamp: Date };
  "agent:destroyed": { timestamp: Date };
}

/**
 * Event names type (for type-safe event emission)
 */
export type SessionEventName = keyof SessionEvents;
export type AgentEventName = keyof AgentLevelEvents;
