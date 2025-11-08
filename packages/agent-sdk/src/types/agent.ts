import type { Observable } from "rxjs";
import type { Logger } from "@deepracticex/logger";
import type { SessionOptions } from "./config";
import type { SessionEvent, AgentStatus } from "./events";
import type { Session, SessionCreateOptions } from "./session";
import type { AgentAdapter } from "./adapter";
import type { AgentPersister } from "./persister";
import type { SessionFactory } from "./session";

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

/**
 * Optional dependencies for Agent creation
 * Allows users to inject custom implementations for testing or different providers
 */
export interface AgentDependencies {
  /**
   * Custom AI adapter (default: ClaudeAdapter)
   * Use this to switch to different AI providers (e.g., OpenAI, Gemini)
   */
  adapter?: AgentAdapter;

  /**
   * Custom persister (default: SQLiteAgentPersister)
   * Use this to switch storage backends (e.g., Redis, PostgreSQL)
   */
  persister?: AgentPersister;

  /**
   * Custom session factory (default: ClaudeSessionFactory)
   * Use this when using a different adapter that requires different session implementation
   */
  sessionFactory?: SessionFactory;

  /**
   * Custom logger (default: SDK logger from config)
   */
  logger?: Logger;
}
