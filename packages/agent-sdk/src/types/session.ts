import type { Observable } from "rxjs";
import type {
  AnyMessage,
  ContentBlock,
  SessionState,
  SessionMetadata,
  TokenUsage,
} from "@deepractice-ai/agent-types";

/**
 * Session interface - SDK-specific with Observable methods
 * This is different from agent-types Session which is a data structure
 */
export interface Session {
  readonly id: string;
  readonly createdAt: Date;
  readonly state: SessionState;

  // Actions
  send(content: string | ContentBlock[]): Promise<void>;
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

/**
 * Options for creating a new session
 */
export interface SessionCreateOptions {
  model?: string;
  initialMessage: string; // Required: lazy session creation
}
