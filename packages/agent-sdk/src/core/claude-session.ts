import { Observable, Subject } from "rxjs";
import type { Logger } from "@deepracticex/logger";
import type {
  Session,
  SessionState,
  SessionMetadata,
  TokenUsage,
  AnyMessage,
  SessionOptions,
} from "~/types";
import type { ClaudeAdapter } from "./claude-adapter";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";

/**
 * ClaudeSession - Session implementation for Claude SDK
 */
export class ClaudeSession implements Session {
  public readonly id: string;
  public readonly createdAt: Date;

  private _state: SessionState = "created";
  private messages: AnyMessage[] = [];
  private messageSubject = new Subject<AnyMessage>();
  private tokenUsage: TokenUsage = {
    used: 0,
    total: 0,
    breakdown: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheCreation: 0,
    },
  };
  private metadata: SessionMetadata;
  private adapter: ClaudeAdapter;
  private options: SessionOptions;
  private realSessionId: string | null = null; // Claude SDK session ID
  private logger: Logger;

  constructor(
    id: string,
    metadata: SessionMetadata,
    adapter: ClaudeAdapter,
    options: SessionOptions = {},
    isWarmSession: boolean,
    logger: Logger
  ) {
    this.id = id;
    this.createdAt = new Date();
    this.metadata = metadata;
    this.adapter = adapter;
    this.options = options;
    this.logger = logger;
    // If this is from warmup pool, id is already Claude SDK session_id
    if (isWarmSession) {
      this.realSessionId = id;
    }
    this.logger.debug({ sessionId: id, isWarmSession }, "ClaudeSession constructed");
  }

  get state(): SessionState {
    return this._state;
  }

  async send(content: string): Promise<void> {
    if (this.isCompleted()) {
      this.logger.warn(
        { sessionId: this.id, state: this._state },
        "Cannot send message: session completed"
      );
      throw new Error(`Cannot send message: session is ${this._state}`);
    }

    this.logger.debug(
      { sessionId: this.id, contentLength: content.length, hasRealSessionId: !!this.realSessionId },
      "Sending message"
    );

    const prevState = this._state;
    this._state = "active";

    try {
      // Stream messages from Claude SDK
      const streamOptions = {
        ...this.options,
        // Only pass resume if we have a real session ID from Claude SDK
        ...(this.realSessionId && { resume: this.realSessionId }),
      };

      let messageCount = 0;
      for await (const sdkMessage of this.adapter.stream(content, streamOptions)) {
        // Capture session_id from first message
        if (!this.realSessionId && sdkMessage.session_id) {
          this.realSessionId = sdkMessage.session_id;
          this.logger.debug(
            { sessionId: this.id, realSessionId: this.realSessionId },
            "Captured real session ID"
          );
        }

        this.processSDKMessage(sdkMessage);
        messageCount++;
      }

      // After streaming completes, session becomes idle (waiting for next input)
      this._state = "idle";
      this.logger.info(
        { sessionId: this.id, messageCount, prevState, newState: "idle" },
        "Message sent successfully"
      );
    } catch (error) {
      this._state = "error";
      this.logger.error(
        { err: error, sessionId: this.id, contentLength: content.length },
        "Failed to send message"
      );
      this.messageSubject.error(error);
      throw error;
    }
  }

  private processSDKMessage(sdkMessage: SDKMessage): void {
    // Transform SDK message to our format
    const message = this.transformSDKMessage(sdkMessage);

    if (message) {
      this.messages.push(message);
      this.messageSubject.next(message);
    }

    // Extract token usage from result messages
    if (sdkMessage.type === "result" && "usage" in sdkMessage) {
      this.updateTokenUsageFromSDK(sdkMessage);
    }
  }

  private transformSDKMessage(sdkMessage: SDKMessage): AnyMessage | null {
    // Map SDK message types to our message types
    if (sdkMessage.type === "user") {
      return {
        id: sdkMessage.uuid || `user-${Date.now()}`,
        type: "user",
        content: this.extractTextContent(sdkMessage.message.content),
        timestamp: new Date(),
      };
    }

    if (sdkMessage.type === "assistant") {
      return {
        id: sdkMessage.uuid || `assistant-${Date.now()}`,
        type: "assistant",
        content: this.extractTextContent(sdkMessage.message.content),
        timestamp: new Date(),
      };
    }

    // System messages don't need to be exposed
    return null;
  }

  /**
   * Extract text content from Claude API content blocks
   * Claude API returns content as array of blocks: [{ type: "text", text: "..." }]
   */
  private extractTextContent(content: string | Array<any>): string {
    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n");
    }

    return String(content);
  }

  private updateTokenUsageFromSDK(resultMessage: any): void {
    if (resultMessage.usage) {
      const usage = resultMessage.usage;
      this.tokenUsage = {
        used:
          usage.input_tokens +
          usage.output_tokens +
          (usage.cache_read_input_tokens || 0) +
          (usage.cache_creation_input_tokens || 0),
        total: 160000, // TODO: Get from config
        breakdown: {
          input: usage.input_tokens || 0,
          output: usage.output_tokens || 0,
          cacheRead: usage.cache_read_input_tokens || 0,
          cacheCreation: usage.cache_creation_input_tokens || 0,
        },
      };
      this.logger.debug(
        {
          sessionId: this.id,
          tokenUsage: this.tokenUsage,
        },
        "Token usage updated"
      );
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

  // Internal methods for SessionManager
  _setState(state: SessionState): void {
    this._state = state;
  }

  _addMessage(message: AnyMessage): void {
    this.messages.push(message);
    this.messageSubject.next(message);
  }

  _updateTokenUsage(usage: TokenUsage): void {
    this.tokenUsage = usage;
  }

  _completeStream(): void {
    this.messageSubject.complete();
  }

  _errorStream(error: Error): void {
    this.messageSubject.error(error);
  }
}
