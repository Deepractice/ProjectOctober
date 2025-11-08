import { Observable, Subject } from "rxjs";
import { randomUUID } from "crypto";
import type {
  AgentConfig,
  SessionEvent,
  Session,
  PerformanceMetrics,
  SessionCreateOptions,
  AgentPersister,
  AgentAdapter,
  SessionFactory,
} from "~/types";
import type { Logger } from "@deepracticex/logger";

/**
 * SessionManager - manages all sessions lifecycle
 *
 * Refactored to use dependency injection:
 * - AgentAdapter (interface) instead of ClaudeAdapter (concrete class)
 * - SessionFactory (interface) for creating sessions
 * - No longer depends on Claude-specific implementation
 */
export class SessionManager {
  private sessions = new Map<string, Session>();
  private sessionEventsSubject = new Subject<SessionEvent>();
  private metrics = {
    totalCreated: 0,
    totalResponseTime: 0,
  };

  constructor(
    private readonly config: AgentConfig,
    private readonly adapter: AgentAdapter,
    private readonly persister: AgentPersister,
    private readonly sessionFactory: SessionFactory,
    private readonly logger: Logger
  ) {
    this.logger.debug({ adapterName: adapter.getName() }, "SessionManager created");
  }

  /**
   * Create a new session with initial message
   *
   * New flow (no placeholder ID):
   * 1. Generate UUID for session
   * 2. Create session via SessionFactory
   * 3. Send initial message (session will handle Claude session_id extraction)
   * 4. Return session
   */
  async createSession(options: SessionCreateOptions): Promise<Session> {
    const startTime = Date.now();

    // Generate our own session ID (UUID)
    const sessionId = randomUUID();

    this.logger.debug({ sessionId, model: options?.model }, "Creating new session");

    // Create session via factory
    const session = this.sessionFactory.createSession(
      sessionId,
      {
        projectPath: this.config.workspace,
        model: options?.model || this.config.model || "claude-sonnet-4",
        startTime: new Date(),
      },
      this.adapter,
      { model: options?.model },
      this.persister.messages
    );

    // Add to map immediately
    this.sessions.set(sessionId, session);

    try {
      // Send initial message
      await session.send(options.initialMessage);

      this.logger.info(
        { sessionId, messageCount: session.getMessages().length },
        "Session created successfully"
      );

      this.sessionEventsSubject.next({ type: "created", sessionId });

      this.metrics.totalCreated++;
      const responseTime = Date.now() - startTime;
      this.metrics.totalResponseTime += responseTime;

      return session;
    } catch (error) {
      // If initial message fails, remove from map
      this.sessions.delete(sessionId);
      this.logger.error({ err: error, sessionId }, "Failed to create session");
      throw error;
    }
  }

  /**
   * Get a session by ID
   */
  getSession(id: string): Session | null {
    const session = this.sessions.get(id);

    if (!session) {
      return null;
    }

    if (session.state === "deleted") {
      return null;
    }

    return session;
  }

  /**
   * Get all sessions with pagination
   */
  getSessions(limit: number, offset: number): Session[] {
    const all = Array.from(this.sessions.values());

    // Sort by start time (newest first)
    all.sort((a, b) => {
      const metaA = a.getMetadata().startTime;
      const metaB = b.getMetadata().startTime;
      const timeA = metaA instanceof Date ? metaA.getTime() : new Date(metaA).getTime();
      const timeB = metaB instanceof Date ? metaB.getTime() : new Date(metaB).getTime();
      return timeB - timeA;
    });

    return all.slice(offset, offset + limit);
  }

  /**
   * Delete a session
   */
  async deleteSession(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      this.logger.debug({ sessionId: id }, "Deleting session");

      await session.delete();

      this.sessions.delete(id);
      this.sessionEventsSubject.next({ type: "deleted", sessionId: id });
      this.logger.info({ sessionId: id }, "Session deleted");
    } else {
      this.logger.warn({ sessionId: id }, "Attempted to delete non-existent session");
    }
  }

  /**
   * Session events observable
   */
  sessionEvents$(): Observable<SessionEvent> {
    return this.sessionEventsSubject.asObservable();
  }

  /**
   * Get count of active sessions
   */
  activeCount(): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (!session.isCompleted()) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return {
      avgResponseTime:
        this.metrics.totalCreated > 0
          ? this.metrics.totalResponseTime / this.metrics.totalCreated
          : 0,
      totalSessions: this.sessions.size,
      cacheHitRate: 0, // TODO: Calculate from actual cache stats
    };
  }

  /**
   * Destroy session manager
   */
  destroy(): void {
    this.logger.info({ sessionCount: this.sessions.size }, "Destroying SessionManager");
    for (const session of this.sessions.values()) {
      session.delete().catch((err) => {
        this.logger.warn({ err, sessionId: session.id }, "Failed to delete session during destroy");
      });
    }
    this.sessions.clear();
    this.sessionEventsSubject.complete();
    this.logger.debug("SessionManager destroyed");
  }

  /**
   * Load historical sessions
   * TODO: Implement persistence-backed session loading
   * For now, this is a no-op (sessions are created fresh)
   */
  async loadHistoricalSessions(): Promise<void> {
    this.logger.debug("Loading historical sessions (not implemented yet)");
    // TODO: Query persister for session list
    // TODO: Use sessionFactory to recreate sessions
  }
}
