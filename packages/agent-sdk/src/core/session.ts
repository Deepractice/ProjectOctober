import { Subject } from "rxjs";
import type { Observable } from "rxjs";
import { randomUUID } from "crypto";
import type { Logger } from "@deepracticex/logger";
import type {
  Session as ISession,
  SessionState,
  SessionMetadata,
  TokenUsage,
  AnyMessage,
  UserMessage,
  ContentBlock,
  SessionOptions,
  AgentAdapter,
  DomainMessage,
  AgentPersister,
} from "~/types";

/**
 * Session - Provider-agnostic session implementation
 *
 * This is a concrete class that works with ANY AI provider.
 * All provider-specific logic is handled by the AgentAdapter.
 *
 * Responsibilities:
 * - Message management (in-memory + persistence)
 * - State management
 * - Observable streams
 * - Token usage tracking
 *
 * What Session does NOT do:
 * - Transform provider messages (handled by Adapter)
 * - Extract provider session IDs (handled by Adapter)
 * - Handle provider-specific features (handled by Adapter)
 */
export class Session implements ISession {
  public readonly id: string;
  public readonly createdAt: Date;

  protected _state: SessionState = "created";
  protected messages: AnyMessage[] = [];
  protected messageSubject = new Subject<AnyMessage>();
  protected tokenUsage: TokenUsage = {
    used: 0,
    total: 0,
    breakdown: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheCreation: 0,
    },
  };
  protected metadata: SessionMetadata;
  protected adapter: AgentAdapter;
  protected options: SessionOptions;
  protected logger: Logger;
  protected persister?: AgentPersister;

  constructor(
    id: string,
    metadata: SessionMetadata,
    adapter: AgentAdapter,
    options: SessionOptions,
    logger: Logger,
    persister?: AgentPersister,
    initialMessages: AnyMessage[] = [],
    initialTokenUsage?: TokenUsage
  ) {
    this.id = id;
    this.createdAt = new Date();
    this.metadata = metadata;
    this.adapter = adapter;
    this.options = options;
    this.logger = logger;
    this.persister = persister;

    // Initialize with historical messages if provided
    this.messages = [...initialMessages];
    if (initialTokenUsage) {
      this.tokenUsage = initialTokenUsage;
    }

    this.logger.debug(
      { sessionId: id, hasInitialMessages: initialMessages.length > 0 },
      "Session constructed"
    );

    // Load persisted messages if available
    this.loadPersistedMessages();
  }

  get state(): SessionState {
    return this._state;
  }

  /**
   * Send a message to the AI model
   */
  async send(content: string | ContentBlock[]): Promise<void> {
    if (this.isCompleted()) {
      this.logger.warn(
        { sessionId: this.id, state: this._state },
        "Cannot send message: session completed"
      );
      throw new Error(`Cannot send message: session is ${this._state}`);
    }

    this.logger.debug({ sessionId: this.id, contentType: typeof content }, "Send called");

    // 1. Add user message
    const userMessage = this.createUserMessage(content);
    this.addMessage(userMessage);
    this.persistMessage(userMessage);

    this._state = "active";

    try {
      // 2. Stream from adapter (adapter returns already-transformed domain messages)
      let messageCount = 0;
      for await (const domainMsg of this.adapter.stream(content, this.options)) {
        messageCount++;

        this.logger.debug(
          { sessionId: this.id, messageType: domainMsg.type, messageCount },
          "Received domain message from adapter"
        );

        // 3. Handle options updates from adapter
        if (domainMsg.updatedOptions) {
          this.logger.debug(
            { sessionId: this.id, updates: domainMsg.updatedOptions },
            "Applying options updates from adapter"
          );
          this.options = { ...this.options, ...domainMsg.updatedOptions };
        }

        // 4. Add message (already in domain format)
        this.addMessage(domainMsg);
        this.persistMessage(domainMsg);

        // 5. Update token usage
        if (domainMsg.usage) {
          this.updateTokenUsage(domainMsg.usage);
        }
      }

      this.logger.info(
        { sessionId: this.id, messagesReceived: messageCount },
        "Adapter stream completed"
      );

      // After streaming completes, session becomes idle
      this._state = "idle";

      // Save session metadata (update lastActivity and summary)
      await this.saveSessionMetadata();
    } catch (error) {
      this._state = "error";
      this.logger.error({ err: error, sessionId: this.id }, "Failed to send message");
      this.messageSubject.error(error);
      throw error;
    }
  }

  async abort(): Promise<void> {
    if (this._state !== "active") {
      this.logger.warn(
        { sessionId: this.id, state: this._state },
        "Cannot abort: session not active"
      );
      throw new Error(`Cannot abort: session is ${this._state}`);
    }

    this.logger.info({ sessionId: this.id }, "Aborting session");
    this._state = "aborted";
    this.messageSubject.complete();
  }

  async complete(): Promise<void> {
    if (this.isCompleted()) {
      this.logger.warn({ sessionId: this.id, state: this._state }, "Session already completed");
      throw new Error(`Session already ${this._state}`);
    }

    this.logger.info({ sessionId: this.id }, "Completing session");
    this._state = "completed";
    this.messageSubject.complete();
  }

  async delete(): Promise<void> {
    this.logger.debug({ sessionId: this.id, prevState: this._state }, "Deleting session");
    this._state = "deleted";
    this.messageSubject.complete();
  }

  messages$(): Observable<AnyMessage> {
    return this.messageSubject.asObservable();
  }

  getMessages(limit?: number, offset = 0): AnyMessage[] {
    const end = limit ? offset + limit : undefined;
    return this.messages.slice(offset, end);
  }

  getTokenUsage(): TokenUsage {
    return { ...this.tokenUsage };
  }

  getMetadata(): SessionMetadata {
    return { ...this.metadata };
  }

  summary(): string {
    const messages = this.getMessages(10);

    // Find first real user message
    const firstUserMsg = messages.find((m) => {
      if (m.type !== "user") return false;

      const content = m.content;

      // Handle ContentBlock[]
      if (Array.isArray(content)) {
        return content.length > 0;
      }

      // Handle string content - filter system messages
      const contentStr = content || "";
      const isSystemMessage =
        contentStr.startsWith("<command-name>") ||
        contentStr.startsWith("<command-message>") ||
        contentStr.startsWith("<system-reminder>") ||
        contentStr === "Warmup";

      return !isSystemMessage && contentStr.length > 0;
    });

    if (firstUserMsg && firstUserMsg.type === "user") {
      const userMsg = firstUserMsg as UserMessage;
      const contentStr =
        typeof userMsg.content === "string" ? userMsg.content : JSON.stringify(userMsg.content);
      const summary = contentStr.substring(0, 100);
      return contentStr.length > 100 ? `${summary}...` : summary;
    }

    return "New Session";
  }

  isActive(): boolean {
    return this._state === "active";
  }

  isCompleted(): boolean {
    return (
      this._state === "completed" ||
      this._state === "error" ||
      this._state === "aborted" ||
      this._state === "deleted"
    );
  }

  // ========================================
  // Protected helper methods
  // ========================================

  protected createUserMessage(content: string | ContentBlock[]): UserMessage {
    return {
      id: randomUUID(),
      type: "user",
      content,
      timestamp: new Date(),
    };
  }

  protected addMessage(message: AnyMessage): void {
    this.messages.push(message);
    this.messageSubject.next(message);
  }

  protected persistMessage(message: AnyMessage): void {
    if (!this.persister) {
      return;
    }

    // Fire and forget - don't block
    this.persister.saveMessage(this.id, message).catch((error) => {
      this.logger.error(
        { error, sessionId: this.id, messageId: message.id },
        "Failed to persist message"
      );
    });
  }

  /**
   * Save session metadata to database
   * Called after messages are sent to update lastActivity and summary
   */
  private async saveSessionMetadata(): Promise<void> {
    if (!this.persister) {
      return;
    }

    try {
      await this.persister.saveSession({
        id: this.id,
        summary: this.summary(),
        createdAt: this.createdAt,
        lastActivity: new Date(),
        cwd: this.metadata.projectPath,
      });

      this.logger.debug({ sessionId: this.id }, "Session metadata saved");
    } catch (error) {
      this.logger.error({ error, sessionId: this.id }, "Failed to save session metadata");
      // Don't throw - this is not critical
    }
  }

  protected updateTokenUsage(usage: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number;
    cache_creation_input_tokens?: number;
  }): void {
    this.tokenUsage.breakdown.input += usage.input_tokens || 0;
    this.tokenUsage.breakdown.output += usage.output_tokens || 0;
    this.tokenUsage.breakdown.cacheRead += usage.cache_read_input_tokens || 0;
    this.tokenUsage.breakdown.cacheCreation += usage.cache_creation_input_tokens || 0;

    this.tokenUsage.used =
      this.tokenUsage.breakdown.input +
      this.tokenUsage.breakdown.output +
      this.tokenUsage.breakdown.cacheRead +
      this.tokenUsage.breakdown.cacheCreation;

    this.logger.debug({ sessionId: this.id, tokenUsage: this.tokenUsage }, "Token usage updated");
  }

  private async loadPersistedMessages(): Promise<void> {
    if (!this.persister) {
      return;
    }

    try {
      const persistedMessages = await this.persister.getMessages(this.id);

      if (persistedMessages && persistedMessages.length > 0) {
        this.logger.info(
          { sessionId: this.id, count: persistedMessages.length },
          "Loaded persisted messages"
        );

        this.messages = persistedMessages;

        for (const message of persistedMessages) {
          this.messageSubject.next(message);
        }
      }
    } catch (error) {
      this.logger.error({ error, sessionId: this.id }, "Failed to load persisted messages");
    }
  }
}
