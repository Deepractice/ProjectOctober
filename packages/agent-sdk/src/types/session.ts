import type { Observable } from "rxjs";
import type { AnyMessage } from "./message";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";

export type SessionState =
  | "created"
  | "active"
  | "idle"
  | "completed"
  | "error"
  | "aborted"
  | "deleted";

export interface TokenUsage {
  used: number;
  total: number;
  breakdown: {
    input: number;
    output: number;
    cacheRead: number;
    cacheCreation: number;
  };
}

export interface SessionMetadata {
  projectPath: string;
  model: string;
  startTime: Date;
  endTime?: Date;
}

/**
 * Options for creating a new session
 * initialMessage is REQUIRED - sessions are only created when user sends first message
 */
export interface SessionCreateOptions {
  model?: string;
  initialMessage: string; // Required: lazy session creation
  tempId?: string; // Optional: frontend temp ID for streaming events before real ID is available
}

/**
 * Session interface - represents a conversation with Claude
 */
export interface Session {
  readonly id: string;
  readonly createdAt: Date;
  readonly state: SessionState;

  // Actions
  send(content: string): Promise<void>;
  abort(): Promise<void>;
  complete(): Promise<void>;
  delete(): Promise<void>;

  // Observables
  messages$(): Observable<AnyMessage>;
  streamEvents$(): Observable<SDKMessage>;

  // Queries
  getMessages(limit?: number, offset?: number): AnyMessage[];
  getTokenUsage(): TokenUsage;
  getMetadata(): SessionMetadata;
  getLastError(): Error | null;
  summary(): string;

  // Utilities
  isActive(): boolean;
  isCompleted(): boolean;
}
