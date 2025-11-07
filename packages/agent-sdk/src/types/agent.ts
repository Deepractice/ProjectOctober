import type { Observable } from "rxjs";
import type { SessionOptions } from "./config";
import type { SessionEvent, AgentStatus } from "./events";
import type { Session, SessionCreateOptions } from "./session";

/**
 * Agent interface - main entry point for the SDK
 */
export interface Agent {
  // Lifecycle
  initialize(): Promise<void>;
  destroy(): void;

  // Session management
  createSession(options: SessionCreateOptions): Promise<Session>;
  getSession(id: string): Session | null;
  getSessions(limit?: number, offset?: number): Session[];

  // Quick API
  chat(message: string, options?: SessionOptions): Promise<Session>;

  // Observables
  sessions$(): Observable<SessionEvent>;

  // Status
  getStatus(): AgentStatus;
}
