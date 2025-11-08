import { Observable } from "rxjs";
import type {
  Agent,
  AgentConfig,
  SessionOptions,
  SessionCreateOptions,
  SessionEvent,
  AgentStatus,
  Session,
  AgentAdapter,
  AgentPersister,
} from "~/types";
import { SessionManager } from "./session-manager";
import type { Logger } from "@deepracticex/logger";

/**
 * AgentCore - Core Agent implementation
 *
 * Provider-agnostic agent implementation:
 * - Uses AgentAdapter interface (all provider logic in adapter)
 * - Uses concrete Session class (no factory needed)
 * - Uses AgentPersister interface for persistence
 *
 * This class contains only business logic, no provider-specific code
 */
export class AgentCore implements Agent {
  private sessionManager: SessionManager;
  private initialized = false;
  private logger: Logger;

  constructor(
    config: AgentConfig,
    adapter: AgentAdapter,
    persister: AgentPersister,
    logger: Logger
  ) {
    this.logger = logger;
    this.logger.debug(
      { workspace: config.workspace, model: config.model, adapterName: adapter.getName() },
      "Creating AgentCore"
    );

    this.sessionManager = new SessionManager(config, adapter, persister, logger);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.warn("Agent already initialized");
      throw new Error("Agent already initialized");
    }

    this.logger.info("Initializing AgentCore");

    try {
      // Load historical sessions
      await this.sessionManager.loadHistoricalSessions();

      this.initialized = true;
      this.logger.info("AgentCore initialized successfully");
    } catch (err) {
      this.logger.error({ err }, "Failed to initialize AgentCore");
      throw err;
    }
  }

  destroy(): void {
    this.logger.info("Destroying AgentCore");
    this.sessionManager.destroy();
    this.initialized = false;
    this.logger.debug("AgentCore destroyed");
  }

  async createSession(options: SessionCreateOptions): Promise<Session> {
    this.ensureInitialized();
    this.logger.debug({ model: options?.model }, "Creating new session");
    const session = await this.sessionManager.createSession(options);
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
      throw new Error("Agent not initialized. Call initialize() first.");
    }
  }
}
