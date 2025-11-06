import type { Observable } from "rxjs";
import type { AnyMessage } from "./message";

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

  // Queries
  getMessages(limit?: number, offset?: number): AnyMessage[];
  getTokenUsage(): TokenUsage;
  getMetadata(): SessionMetadata;
  summary(): string;

  // Utilities
  isActive(): boolean;
  isCompleted(): boolean;
}
