import { Observable } from "rxjs";
import EventEmitter from "eventemitter3";
import { injectable, inject } from "tsyringe";
import type {
  Agent,
  SessionOptions,
  SessionCreateOptions,
  SessionEvent,
  AgentStatus,
  Session,
  AgentLevelEvents,
} from "~/types";
import { SessionManager } from "./SessionManager";
import type { Logger } from "@deepracticex/logger";
import { AgentErrors } from "~/errors/base";

/**
 * AgentCore - Core Agent implementation with event aggregation
 *
 * Architecture:
 * - Extends EventEmitter to aggregate events from all sessions
 * - Provider-agnostic (uses AgentAdapter interface)
 * - Uses DI for all dependencies
 * - Event-driven for real-time monitoring and visualization
 *
 * Events:
 * - Aggregates all session events (agent state, messages, persistence, etc.)
 * - Emits agent-level events (initialized, destroyed)
 * - Users can subscribe to all events across all sessions
 *
 * This class contains only business logic, no provider-specific code
 */
@injectable()
export class AgentCore extends EventEmitter<AgentLevelEvents> implements Agent {
  private initialized = false;

  constructor(
    @inject(SessionManager) private sessionManager: SessionManager,
    @inject("Logger") private logger: Logger
  ) {
    super(); // Initialize EventEmitter
    this.logger.debug("Creating AgentCore");
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn("Agent already initialized");
      throw AgentErrors.alreadyInitialized();
    }

    this.logger.info("Initializing AgentCore");

    try {
      // Load historical sessions
      await this.sessionManager.loadHistoricalSessions();

      this.initialized = true;

      // Get session count
      const sessions = this.sessionManager.getSessions(10000, 0);

      // Emit initialized event
      this.emit("agent:initialized", {
        sessionCount: sessions.length,
        timestamp: new Date(),
      });

      this.logger.info({ sessionCount: sessions.length }, "AgentCore initialized successfully");
    } catch (err) {
      this.logger.error({ err }, "Failed to initialize AgentCore");
      throw err;
    }
  }

  destroy(): void {
    this.logger.info("Destroying AgentCore");

    this.sessionManager.destroy();
    this.initialized = false;

    // Emit destroyed event
    this.emit("agent:destroyed", { timestamp: new Date() });

    this.logger.debug("AgentCore destroyed");
  }

  async createSession(options: SessionCreateOptions): Promise<Session> {
    this.ensureInitialized();
    this.logger.debug({ model: options?.model }, "Creating new session");

    const session = await this.sessionManager.createSession(options);

    // Bridge: re-emit session events at agent level
    // Note: We can't use onAny() as it doesn't exist in eventemitter3
    // Instead, we manually listen to specific events we care about
    session.on("session:active", (...args) => this.emit("session:active", ...args));
    session.on("session:idle", (...args) => this.emit("session:idle", ...args));
    session.on("session:completed", (...args) => this.emit("session:completed", ...args));
    session.on("session:error", (...args) => this.emit("session:error", ...args));
    session.on("session:deleted", (...args) => this.emit("session:deleted", ...args));
    session.on("message:user", (...args) => this.emit("message:user", ...args));
    session.on("message:agent", (...args) => this.emit("message:agent", ...args));
    session.on("agent:idle", (...args) => this.emit("agent:idle", ...args));
    session.on("agent:thinking", (...args) => this.emit("agent:thinking", ...args));
    session.on("agent:speaking", (...args) => this.emit("agent:speaking", ...args));
    session.on("agent:completed", (...args) => this.emit("agent:completed", ...args));
    session.on("stream:start", (...args) => this.emit("stream:start", ...args));
    session.on("stream:chunk", (...args) => this.emit("stream:chunk", ...args));
    session.on("stream:end", (...args) => this.emit("stream:end", ...args));

    // Emit session:created event at agent level
    // (Session already emitted it, but we missed it since we set up listeners after creation)
    this.emit("session:created", { sessionId: session.id, timestamp: new Date() });

    this.logger.info({ sessionId: session.id, model: options?.model }, "Session created");

    return session;
  }

  getSession(id: string): Session | null {
    return this.sessionManager.getSession(id);
  }

  getSessions(limit = 10, offset = 0): Session[] {
    return this.sessionManager.getSessions(limit, offset);
  }

  async chat(message: string, options?: SessionOptions): Promise<Session> {
    this.logger.debug({ messageLength: message.length }, "Starting quick chat");
    try {
      // Create session and send message
      const session = await this.createSession({ model: options?.model });
      await session.send(message);
      return session;
    } catch (err) {
      this.logger.error({ err, messageLength: message.length }, "Quick chat failed");
      throw err;
    }
  }

  sessions$(): Observable<SessionEvent> {
    return this.sessionManager.sessionEvents$();
  }

  getStatus(): AgentStatus {
    return {
      ready: this.initialized,
      warmupPoolSize: 0,
      activeSessions: this.sessionManager.activeCount(),
      metrics: this.sessionManager.getMetrics(),
    };
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw AgentErrors.notInitialized();
    }
  }
}
