import { Subject, BehaviorSubject } from "rxjs";
import type { Observable } from "rxjs";
import { randomUUID } from "crypto";
import EventEmitter from "eventemitter3";
import { createActor } from "xstate";
import type { Logger } from "@deepracticex/logger";
import type {
  Session as ISession,
  SessionState,
  SessionMetadata,
  TokenUsage,
  SessionStatistics,
  PricingConfig,
  AnyMessage,
  UserMessage,
  ContentBlock,
  SessionOptions,
  AgentAdapter,
  AgentPersister,
  SessionEvents,
} from "~/types";
import { createAgentStateMachine, type AgentMachineActor } from "../agent/AgentStateMachine";
import { createSessionStateMachine, type SessionMachineActor } from "./SessionStateMachine";
import { getPricingForModel } from "../pricing";

/**
 * Session - Provider-agnostic, event-driven session implementation
 *
 * Architecture:
 * - Extends EventEmitter for event-driven API
 * - Uses XState for state management (Agent + Session state machines)
 * - Works with ANY AI provider (provider-agnostic)
 *
 * State Machines:
 * - Agent State Machine: What AI is doing (idle, thinking, speaking, tool_calling, etc.)
 * - Session State Machine: Container lifecycle (created, active, idle, completed, etc.)
 *
 * Events:
 * - All state transitions emit events
 * - All messages emit events
 * - All persistence operations emit events
 * - Users can subscribe to events for real-time updates
 *
 * Responsibilities:
 * - Message management (in-memory + persistence)
 * - Dual state management (agent + session)
 * - Event emission
 * - Observable streams (backward compatibility)
 * - Token usage tracking
 * - Statistics tracking (duration, cost, conversation)
 *
 * What Session does NOT do:
 * - Transform provider messages (handled by Adapter)
 * - Extract provider session IDs (handled by Adapter)
 * - Handle provider-specific features (handled by Adapter)
 */
export class Session extends EventEmitter<SessionEvents> implements ISession {
  // State machines
  private agentMachine!: AgentMachineActor;
  private sessionMachine!: SessionMachineActor;
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

  // Statistics tracking
  protected statisticsSubject: BehaviorSubject<SessionStatistics>;
  protected statistics: SessionStatistics;
  protected pricingConfig: PricingConfig;
  protected sessionStartTime?: Date;
  protected currentRequestStartTime?: Date;

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
    super(); // Initialize EventEmitter

    this.id = id;
    this.createdAt = new Date();
    this.metadata = metadata;
    this.adapter = adapter;
    this.options = options;
    this.logger = logger;
    this.persister = persister;

    // Initialize statistics
    this.statistics = {
      duration: { total: 0, api: 0, thinking: 0 },
      cost: {
        total: 0,
        breakdown: { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 },
      },
      conversation: { turns: 0, messages: 0 },
    };
    this.statisticsSubject = new BehaviorSubject<SessionStatistics>(this.statistics);

    // Get pricing config for the model
    this.pricingConfig = getPricingForModel(options.model || "default");

    // Initialize with historical messages if provided
    this.messages = [...initialMessages];
    if (initialTokenUsage) {
      this.tokenUsage = initialTokenUsage;
    }

    this.logger.debug(
      { sessionId: id, hasInitialMessages: initialMessages.length > 0 },
      "Session constructed"
    );

    // Setup state machines
    this.setupStateMachines();

    // Load persisted messages if available
    this.loadPersistedMessages();

    // Emit session created event
    this.emit("session:created", { sessionId: id, timestamp: new Date() });
  }

  /**
   * Setup state machines and bridge them to events
   */
  private setupStateMachines(): void {
    // Create agent state machine (what AI is doing)
    this.agentMachine = createActor(createAgentStateMachine());
    this.agentMachine.start();

    // Create session state machine (container lifecycle)
    this.sessionMachine = createActor(createSessionStateMachine(this.id));
    this.sessionMachine.start();

    // Bridge state machines to event emissions
    this.bridgeStateMachinesToEvents();
  }

  /**
   * Bridge state machine transitions to event emissions
   */
  private bridgeStateMachinesToEvents(): void {
    // Subscribe to agent state changes
    this.agentMachine.subscribe((state) => {
      const agentState = state.value as string;
      const timestamp = new Date();

      this.logger.debug(
        { sessionId: this.id, agentState, context: state.context },
        "Agent state changed"
      );

      // Emit agent state events
      switch (agentState) {
        case "idle":
          this.emit("agent:idle", { timestamp });
          break;
        case "thinking":
          this.emit("agent:thinking", { timestamp });
          break;
        case "speaking":
          // Emitted per chunk in send()
          break;
        case "tool_calling":
          if (state.context.toolCallId && state.context.toolName) {
            this.emit("agent:tool_calling", {
              toolId: state.context.toolCallId,
              toolName: state.context.toolName,
              input: {},
            });
          }
          break;
        case "tool_waiting":
          if (state.context.toolCallId) {
            this.emit("agent:tool_waiting", {
              toolId: state.context.toolCallId,
            });
          }
          break;
        case "error":
          if (state.context.error) {
            this.emit("agent:error", { error: state.context.error });
          }
          break;
        case "completed":
          this.emit("agent:completed", { timestamp });
          break;
      }
    });

    // Subscribe to session state changes
    this.sessionMachine.subscribe((state) => {
      const sessionState = state.value as SessionState;
      const timestamp = new Date();

      this.logger.debug({ sessionId: this.id, sessionState }, "Session state changed");

      // Update internal state
      this._state = sessionState;

      // Emit session state events
      switch (sessionState) {
        case "active":
          this.emit("session:active", { sessionId: this.id, timestamp });
          break;
        case "idle":
          this.emit("session:idle", { sessionId: this.id, timestamp });
          break;
        case "completed":
          this.emit("session:completed", { sessionId: this.id, timestamp });
          break;
        case "error":
          this.emit("session:error", {
            sessionId: this.id,
            error: new Error("Session error"),
            timestamp,
          });
          break;
        case "deleted":
          this.emit("session:deleted", { sessionId: this.id, timestamp });
          break;
      }
    });
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

    // Statistics: Track request start time and increment turns
    this.currentRequestStartTime = new Date();
    if (!this.sessionStartTime) {
      this.sessionStartTime = new Date();
    }
    this.statistics.conversation.turns++;
    this.updateStatistics();

    // 1. Emit stream start
    this.emit("stream:start", { timestamp: new Date() });

    // 2. Session state: created/idle → active
    this.sessionMachine.send({ type: "START" });

    // 3. Create user message
    const userMessage = this.createUserMessage(content);
    this.addMessage(userMessage);

    // 4. Emit user message event
    this.emit("message:user", { message: userMessage });

    // 5. Agent state: idle → thinking (user sent message)
    this.agentMachine.send({ type: "USER_MESSAGE", message: userMessage });

    // 6. Persist user message (synchronous to ensure it's saved)
    await this.persistMessageSync(userMessage);

    try {
      // 7. Stream from adapter
      let chunkIndex = 0;
      let firstChunk = true;
      let firstTokenReceived = false;
      let messageCount = 0;

      for await (const domainMsg of this.adapter.stream(content, this.options)) {
        messageCount++;

        this.logger.debug(
          { sessionId: this.id, messageType: domainMsg.type, messageCount },
          "Received domain message from adapter"
        );

        // Statistics: Track thinking time (time to first token)
        if (!firstTokenReceived && domainMsg.type === "agent" && this.currentRequestStartTime) {
          this.statistics.duration.thinking += Date.now() - this.currentRequestStartTime.getTime();
          firstTokenReceived = true;
        }

        // First chunk: agent starts speaking
        if (firstChunk && domainMsg.type === "agent") {
          this.agentMachine.send({ type: "AGENT_SPEAKING", message: domainMsg });
          firstChunk = false;
        }

        // Handle options updates from adapter
        if (domainMsg.updatedOptions) {
          this.logger.debug(
            { sessionId: this.id, updates: domainMsg.updatedOptions },
            "Applying options updates from adapter"
          );
          this.options = { ...this.options, ...domainMsg.updatedOptions };
        }

        // Add message (already in domain format)
        this.addMessage(domainMsg);

        // Emit message event
        if (domainMsg.type === "agent") {
          this.emit("message:agent", { message: domainMsg as any });

          // Emit speaking event with chunk
          if (typeof domainMsg.content === "string") {
            this.emit("stream:chunk", { chunk: domainMsg.content, index: chunkIndex++ });
            this.emit("agent:speaking", {
              message: domainMsg,
              chunk: domainMsg.content,
            });
          }
        }

        // Handle tool calls
        if (domainMsg.type === "agent" && (domainMsg as any).isToolUse) {
          this.agentMachine.send({
            type: "TOOL_CALL",
            toolId: (domainMsg as any).toolId || "",
            toolName: (domainMsg as any).toolName || "",
            input: (domainMsg as any).toolInput,
          });
        }

        // Persist message (async)
        this.persistMessageAsync(domainMsg);

        // Statistics: Increment message count
        this.statistics.conversation.messages++;

        // Update token usage and cost
        if (domainMsg.usage) {
          this.updateTokenUsage(domainMsg.usage);
          this.calculateCost();
          this.updateStatistics();
        }
      }

      this.logger.info(
        { sessionId: this.id, messagesReceived: messageCount },
        "Adapter stream completed"
      );

      // Statistics: Track API duration
      if (this.currentRequestStartTime) {
        this.statistics.duration.api += Date.now() - this.currentRequestStartTime.getTime();
        this.updateStatistics();
      }

      // 8. Stream complete, emit event
      this.emit("stream:end", { timestamp: new Date(), totalChunks: chunkIndex });

      // 9. Agent state: speaking → idle
      this.agentMachine.send({ type: "RESPONSE_COMPLETE" });

      // 10. Session state: active → idle
      this.sessionMachine.send({ type: "PAUSE" });

      // 11. Save session metadata (update lastActivity and summary)
      await this.saveSessionMetadata();
    } catch (error) {
      // Error handling
      this.agentMachine.send({ type: "ERROR", error: error as Error });
      this.sessionMachine.send({ type: "ERROR" });

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

    // TODO: Implement abort in state machine
    // this.sessionMachine.send({ type: "ABORT" });

    this._state = "aborted";
    this.messageSubject.complete();
  }

  async complete(): Promise<void> {
    if (this.isCompleted()) {
      this.logger.warn({ sessionId: this.id, state: this._state }, "Session already completed");
      throw new Error(`Session already ${this._state}`);
    }

    this.logger.info({ sessionId: this.id }, "Completing session");

    // Session state transition
    this.sessionMachine.send({ type: "COMPLETE" });

    // Agent state transition
    this.agentMachine.send({ type: "COMPLETE" });

    this.messageSubject.complete();
  }

  async delete(): Promise<void> {
    this.logger.debug({ sessionId: this.id, prevState: this._state }, "Deleting session");

    // Session state transition
    this.sessionMachine.send({ type: "DELETE" });

    this.messageSubject.complete();
  }

  messages$(): Observable<AnyMessage> {
    return this.messageSubject.asObservable();
  }

  statistics$(): Observable<SessionStatistics> {
    return this.statisticsSubject.asObservable();
  }

  getMessages(limit?: number, offset = 0): AnyMessage[] {
    const end = limit ? offset + limit : undefined;
    return this.messages.slice(offset, end);
  }

  getTokenUsage(): TokenUsage {
    return { ...this.tokenUsage };
  }

  getStatistics(): SessionStatistics {
    // Update total duration before returning
    if (this.sessionStartTime) {
      this.statistics.duration.total = Date.now() - this.sessionStartTime.getTime();
    }
    return { ...this.statistics };
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

  /**
   * Persist message synchronously (waits for completion)
   * Used for critical messages like user messages
   * NOTE: Does not throw on persistence errors - emits error event instead
   */
  private async persistMessageSync(message: AnyMessage): Promise<void> {
    if (!this.persister) {
      return;
    }

    this.emit("persist:message:start", {
      messageId: message.id,
      sessionId: this.id,
    });

    try {
      await this.persister.saveMessage(this.id, message);

      this.emit("persist:message:success", {
        messageId: message.id,
        sessionId: this.id,
      });

      this.logger.debug({ messageId: message.id }, "Message persisted (sync)");
    } catch (error) {
      this.emit("persist:message:error", {
        messageId: message.id,
        sessionId: this.id,
        error: error as Error,
      });

      this.logger.error(
        { error, sessionId: this.id, messageId: message.id },
        "Failed to persist message (sync)"
      );

      // Don't throw - persistence failures should not prevent message sending
      // The error event is emitted above for applications to handle
    }
  }

  /**
   * Persist message asynchronously (fire-and-forget)
   * Used for AI messages
   */
  private persistMessageAsync(message: AnyMessage): void {
    if (!this.persister) {
      return;
    }

    this.emit("persist:message:start", {
      messageId: message.id,
      sessionId: this.id,
    });

    // Fire and forget - don't block
    this.persister
      .saveMessage(this.id, message)
      .then(() => {
        this.emit("persist:message:success", {
          messageId: message.id,
          sessionId: this.id,
        });

        this.logger.debug({ messageId: message.id }, "Message persisted (async)");
      })
      .catch((error) => {
        this.emit("persist:message:error", {
          messageId: message.id,
          sessionId: this.id,
          error: error as Error,
        });

        this.logger.error(
          { error, sessionId: this.id, messageId: message.id },
          "Failed to persist message (async)"
        );
      });
  }

  /**
   * Legacy method - kept for backward compatibility
   * @deprecated Use persistMessageSync or persistMessageAsync
   */
  protected persistMessage(message: AnyMessage): void {
    this.persistMessageAsync(message);
  }

  /**
   * Save session metadata to database
   * Called after messages are sent to update lastActivity and summary
   */
  private async saveSessionMetadata(): Promise<void> {
    if (!this.persister) {
      return;
    }

    this.emit("persist:session:start", { sessionId: this.id });

    try {
      await this.persister.saveSession({
        id: this.id,
        summary: this.summary(),
        createdAt: this.createdAt,
        lastActivity: new Date(),
        cwd: this.metadata.projectPath,
      });

      this.emit("persist:session:success", { sessionId: this.id });

      this.logger.debug({ sessionId: this.id }, "Session metadata saved");
    } catch (error) {
      this.emit("persist:session:error", {
        sessionId: this.id,
        error: error as Error,
      });

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

  /**
   * Calculate cost based on token usage and pricing config
   */
  private calculateCost(): void {
    const prices = this.pricingConfig.prices;

    this.statistics.cost.breakdown.input =
      (this.tokenUsage.breakdown.input / 1_000_000) * prices.inputPerMillion;

    this.statistics.cost.breakdown.output =
      (this.tokenUsage.breakdown.output / 1_000_000) * prices.outputPerMillion;

    this.statistics.cost.breakdown.cacheRead =
      (this.tokenUsage.breakdown.cacheRead / 1_000_000) * prices.cacheReadPerMillion;

    this.statistics.cost.breakdown.cacheCreation =
      (this.tokenUsage.breakdown.cacheCreation / 1_000_000) * prices.cacheCreationPerMillion;

    this.statistics.cost.total =
      this.statistics.cost.breakdown.input +
      this.statistics.cost.breakdown.output +
      this.statistics.cost.breakdown.cacheRead +
      this.statistics.cost.breakdown.cacheCreation;
  }

  /**
   * Update statistics and emit events (EventEmitter + RxJS)
   */
  private updateStatistics(): void {
    // Calculate latest values
    const stats = this.getStatistics();

    // Update RxJS Subject
    this.statisticsSubject.next(stats);

    // Emit EventEmitter event
    this.emit("statistics:updated", {
      statistics: stats,
      timestamp: new Date(),
    });

    this.logger.debug({ sessionId: this.id, statistics: stats }, "Statistics updated");
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
