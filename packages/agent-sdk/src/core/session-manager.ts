import { Observable, Subject } from "rxjs";
import { randomUUID } from "crypto";
import type {
  AgentConfig,
  SessionEvent,
  Session as ISession,
  PerformanceMetrics,
  SessionCreateOptions,
  AgentPersister,
  AgentAdapter,
} from "~/types";
import type { Logger } from "@deepracticex/logger";
import { Session } from "./session";

/**
 * SessionManager - manages all sessions lifecycle
 *
 * Uses concrete Session class (provider-agnostic).
 * All provider-specific logic is in AgentAdapter.
 */
export class SessionManager {
  private sessions = new Map<string, ISession>();
  private sessionEventsSubject = new Subject<SessionEvent>();
  private metrics = {
    totalCreated: 0,
    totalResponseTime: 0,
  };

  constructor(
    private readonly config: AgentConfig,
    private readonly adapter: AgentAdapter,
    private readonly persister: AgentPersister,
    private readonly logger: Logger
  ) {
    this.logger.debug({ adapterName: adapter.getName() }, "SessionManager created");
  }

  /**
   * Create a new session
   *
   * Flow:
   * 1. Generate UUID for session
   * 2. Save session metadata to database
   * 3. Create Session instance directly
   * 4. Add to in-memory map
   * 5. Return session (ready to receive messages via session.send())
   */
  async createSession(options: SessionCreateOptions = {}): Promise<ISession> {
    const startTime = Date.now();

    // Generate our own session ID (UUID)
    const sessionId = randomUUID();

    this.logger.debug({ sessionId, model: options.model }, "Creating new session");

    const sessionData = {
      id: sessionId,
      summary: options.summary || "New Session",
      createdAt: new Date(),
      lastActivity: new Date(),
      cwd: this.config.workspace,
    };

    // Save session to database first
    await this.persister.saveSession(sessionData);

    this.logger.debug({ sessionId }, "Session metadata saved to database");

    // Create session directly (no factory needed - Session is provider-agnostic)
    const session = new Session(
      sessionId,
      {
        projectPath: this.config.workspace,
        model: options.model || this.config.model || "claude-sonnet-4",
        startTime: new Date(),
      },
      this.adapter,
      { model: options.model },
      this.logger,
      this.persister
    );

    // Add to in-memory map
    this.sessions.set(sessionId, session);

    this.logger.info({ sessionId }, "Session created successfully");

    this.sessionEventsSubject.next({ type: "created", sessionId });

    this.metrics.totalCreated++;
    const responseTime = Date.now() - startTime;
    this.metrics.totalResponseTime += responseTime;

    return session;
  }

  /**
   * Get a session by ID
   */
  getSession(id: string): ISession | null {
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
  getSessions(limit: number, offset: number): ISession[] {
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
   * Load historical sessions from database
   * Restores all sessions with their messages into memory
   */
  async loadHistoricalSessions(): Promise<void> {
    this.logger.info("Loading historical sessions from database");

    try {
      // Get all sessions from database
      const sessionDataList = await this.persister.getAllSessions();

      this.logger.debug({ count: sessionDataList.length }, "Found sessions in database");

      for (const sessionData of sessionDataList) {
        // Load messages for this session
        const messages = await this.persister.getMessages(sessionData.id);

        // TODO: Load token usage from database (need to add to schema)
        const tokenUsage = undefined;

        // Recreate session object directly (no factory needed)
        const session = new Session(
          sessionData.id,
          {
            projectPath: sessionData.cwd || this.config.workspace,
            model: this.config.model || "claude-sonnet-4",
            startTime: sessionData.createdAt,
          },
          this.adapter,
          {},
          this.logger,
          this.persister,
          messages,
          tokenUsage
        );

        // Add to in-memory map
        this.sessions.set(sessionData.id, session);

        this.logger.debug(
          { sessionId: sessionData.id, messageCount: messages.length },
          "Session restored"
        );
      }

      this.logger.info(
        { totalSessions: this.sessions.size },
        "Historical sessions loaded successfully"
      );
    } catch (error) {
      this.logger.error({ error }, "Failed to load historical sessions");
      throw error;
    }
  }
}
