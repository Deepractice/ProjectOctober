import { Observable, Subject } from "rxjs";
import { randomUUID } from "crypto";
import type { Logger } from "@deepracticex/logger";
import type {
  Session,
  SessionState,
  SessionMetadata,
  TokenUsage,
  AnyMessage,
  UserMessage,
  SessionOptions,
  ContentBlock,
  MessagePersister,
} from "~/types";
import type { ClaudeAdapter } from "./claude-adapter";
import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { SessionInitializer } from "./session-initializer";

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
  private messagePersister?: MessagePersister;
  private initializer?: SessionInitializer;

  constructor(
    id: string,
    metadata: SessionMetadata,
    adapter: ClaudeAdapter,
    options: SessionOptions = {},
    isWarmSession: boolean,
    logger: Logger,
    initialMessages: AnyMessage[] = [],
    initialTokenUsage?: TokenUsage,
    messagePersister?: MessagePersister,
    initializer?: SessionInitializer
  ) {
    this.id = id;
    this.createdAt = new Date();
    this.metadata = metadata;
    this.adapter = adapter;
    this.options = options;
    this.logger = logger;
    this.messagePersister = messagePersister;
    this.initializer = initializer;

    // Initialize with historical messages if provided
    this.messages = [...initialMessages];
    if (initialTokenUsage) {
      this.tokenUsage = initialTokenUsage;
    }

    // If this is from warmup pool, id is already Claude SDK session_id
    if (isWarmSession) {
      this.realSessionId = id;
    }
    this.logger.debug(
      { sessionId: id, isWarmSession, hasInitialMessages: initialMessages.length > 0 },
      "ClaudeSession constructed"
    );

    // Load persisted messages if available
    this.loadPersistedMessages();
  }

  /**
   * Load persisted messages from MessagePersister
   * This runs asynchronously in background
   */
  private async loadPersistedMessages(): Promise<void> {
    if (!this.messagePersister) {
      this.logger.debug({ sessionId: this.id }, "No message persister, skipping load");
      return;
    }

    try {
      const persistedMessages = await this.messagePersister.getMessages(this.id);

      if (persistedMessages && persistedMessages.length > 0) {
        this.logger.info(
          { sessionId: this.id, count: persistedMessages.length },
          "Loaded persisted messages"
        );

        // Replace initial messages with persisted ones (persisted is source of truth)
        this.messages = persistedMessages;

        // Emit all persisted messages to subscribers
        for (const message of persistedMessages) {
          this.messageSubject.next(message);
        }
      } else {
        this.logger.debug({ sessionId: this.id }, "No persisted messages found");
      }
    } catch (error) {
      this.logger.error({ error, sessionId: this.id }, "Failed to load persisted messages");
      // Don't throw - session should still work with initial messages
    }
  }

  /**
   * Persist a message to storage
   * Only persists when realSessionId is available
   */
  private persistMessage(message: AnyMessage): void {
    if (!this.messagePersister || !this.realSessionId) {
      // Don't persist until we have real session ID from Claude SDK
      return;
    }

    // Fire and forget - don't block the main flow
    this.messagePersister.saveMessage(this.realSessionId, message).catch((error) => {
      this.logger.error(
        { error, sessionId: this.realSessionId, messageId: message.id },
        "Failed to persist message"
      );
    });
  }

  get state(): SessionState {
    return this._state;
  }

  async send(content: string | ContentBlock[]): Promise<void> {
    if (this.isCompleted()) {
      this.logger.warn(
        { sessionId: this.id, state: this._state },
        "Cannot send message: session completed"
      );
      throw new Error(`Cannot send message: session is ${this._state}`);
    }

    const contentPreview =
      typeof content === "string"
        ? content.substring(0, 50)
        : JSON.stringify(content).substring(0, 50);
    const contentLength =
      typeof content === "string" ? content.length : JSON.stringify(content).length;

    this.logger.debug(
      {
        sessionId: this.id,
        contentPreview,
        contentLength,
        currentMessagesCount: this.messages.length,
        hasRealSessionId: !!this.realSessionId,
        state: this._state,
      },
      "Send called"
    );

    // ✅ FIX: Manually add user message BEFORE sending to Claude SDK
    // Claude SDK doesn't return user messages in the stream, so we must add it ourselves
    const userMessage: UserMessage = {
      id: randomUUID(),
      type: "user",
      content,
      timestamp: new Date(),
    };

    this.logger.debug(
      {
        sessionId: this.id,
        messageId: userMessage.id,
        contentPreview:
          typeof content === "string"
            ? content.substring(0, 50)
            : `ContentBlock[${content.length}]`,
      },
      "Adding user message manually"
    );

    this.messages.push(userMessage);
    this.messageSubject.next(userMessage);

    // Persist user message
    this.persistMessage(userMessage);

    this.logger.debug(
      { sessionId: this.id, totalMessages: this.messages.length },
      "User message added"
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

      this.logger.debug(
        { sessionId: this.id, hasResume: !!this.realSessionId },
        "Starting SDK stream"
      );

      let messageCount = 0;
      for await (const sdkMessage of this.adapter.stream(content, streamOptions)) {
        messageCount++;
        this.logger.debug(
          {
            sessionId: this.id,
            sdkMessageType: sdkMessage.type,
            hasSessionId: !!sdkMessage.session_id,
            messageCount,
          },
          "Received SDK message"
        );

        // Capture session_id from first message
        if (!this.realSessionId && sdkMessage.session_id) {
          this.realSessionId = sdkMessage.session_id;
          this.logger.info(
            {
              sessionId: this.id,
              realSessionId: this.realSessionId,
              hasInitializer: !!this.initializer,
            },
            "Captured real session ID from SDK"
          );

          // Use SessionInitializer to save session and first user message
          if (this.initializer) {
            this.logger.info({ realSessionId: this.realSessionId }, "Using SessionInitializer");
            await this.initializer.initializeWithRealId(this.realSessionId, userMessage, {
              projectPath: this.metadata.projectPath,
              model: (this.metadata.model as string) || "unknown",
              createdAt: this.createdAt,
            });
            this.logger.info({ realSessionId: this.realSessionId }, "SessionInitializer completed");
          } else {
            this.logger.warn(
              { realSessionId: this.realSessionId },
              "No initializer, using fallback"
            );
            // Fallback: just persist the message (for historical sessions)
            this.persistMessage(userMessage);
          }
        }

        this.processSDKMessage(sdkMessage);
      }

      this.logger.info(
        {
          sessionId: this.id,
          messagesReceived: messageCount,
          totalMessagesNow: this.messages.length,
          messageTypes: this.messages.map((m) => m.type),
        },
        "SDK stream completed"
      );

      // After streaming completes, session becomes idle (waiting for next input)
      this._state = "idle";
      this.logger.info(
        { sessionId: this.id, messageCount, prevState, newState: "idle" },
        "Message sent successfully"
      );
    } catch (error) {
      this._state = "error";
      const contentLength =
        typeof content === "string" ? content.length : JSON.stringify(content).length;
      this.logger.error(
        { err: error, sessionId: this.id, contentLength },
        "Failed to send message"
      );
      this.messageSubject.error(error);
      throw error;
    }
  }

  private processSDKMessage(sdkMessage: SDKMessage): void {
    this.logger.debug(
      {
        sessionId: this.id,
        sdkType: sdkMessage.type,
        currentMessagesCount: this.messages.length,
        hasUuid: !!sdkMessage.uuid,
      },
      "Processing SDK message"
    );

    // Transform SDK message to our format (may return multiple messages)
    const messages = this.transformSDKMessage(sdkMessage);

    if (messages && messages.length > 0) {
      this.logger.debug(
        { sessionId: this.id, transformedCount: messages.length },
        "Transformed messages"
      );

      for (const message of messages) {
        const msg = message as any;
        const contentPreview =
          typeof msg.content === "string"
            ? msg.content.substring(0, 50)
            : Array.isArray(msg.content)
              ? `ContentBlock[${msg.content.length}]`
              : String(msg.content || "").substring(0, 50);
        this.logger.debug(
          {
            sessionId: this.id,
            messageType: message.type,
            messageId: message.id,
            isToolUse: msg.isToolUse,
            toolName: msg.toolName,
            contentPreview,
          },
          "Adding message to stream"
        );

        this.messages.push(message);
        this.messageSubject.next(message);

        // Persist each message
        this.persistMessage(message);
      }

      this.logger.debug(
        { sessionId: this.id, totalMessages: this.messages.length },
        "Messages added to session"
      );
    } else {
      this.logger.debug({ sessionId: this.id }, "No messages after transform");
    }

    // Extract token usage from result messages
    if (sdkMessage.type === "result" && "usage" in sdkMessage) {
      this.updateTokenUsageFromSDK(sdkMessage);
    }
  }

  private transformSDKMessage(sdkMessage: SDKMessage): AnyMessage[] {
    const results: AnyMessage[] = [];
    const timestamp = new Date();

    // Map SDK message types to our message types
    if (sdkMessage.type === "user") {
      const content = sdkMessage.message.content;

      this.logger.debug(
        {
          sessionId: this.id,
          isArray: Array.isArray(content),
          contentType: typeof content,
          contentPreview: Array.isArray(content)
            ? content.map((b) => b.type).join(", ")
            : String(content).substring(0, 100),
        },
        "Processing user message"
      );

      // Check if this is a tool result message (should not be displayed as user message)
      if (Array.isArray(content)) {
        const hasToolResult = content.some((block) => block.type === "tool_result");
        if (hasToolResult) {
          // Tool results are handled separately, don't show as user message
          this.logger.debug({ sessionId: this.id }, "Skipping tool_result user message");
          return [];
        }
      }

      // Regular user message - preserve original content (string or ContentBlock[])
      // Don't use extractTextContent here because it loses images!
      const contentForLog = Array.isArray(content)
        ? `ContentBlock[${content.length}]`
        : String(content).substring(0, 50);

      this.logger.debug(
        {
          sessionId: this.id,
          contentType: Array.isArray(content) ? "ContentBlock[]" : "string",
          contentPreview: contentForLog,
        },
        "Creating user message"
      );

      results.push({
        id: sdkMessage.uuid || `user-${Date.now()}`,
        type: "user",
        content: content as string | ContentBlock[], // ✅ Preserve original content (string | ContentBlock[])
        timestamp,
      });
      return results;
    }

    if (sdkMessage.type === "assistant") {
      const content = sdkMessage.message.content;

      this.logger.debug(
        {
          sessionId: this.id,
          isArray: Array.isArray(content),
          blockCount: Array.isArray(content) ? content.length : 0,
          blockTypes: Array.isArray(content) ? content.map((b) => b.type).join(", ") : "string",
        },
        "Processing assistant message"
      );

      if (Array.isArray(content)) {
        // Process each content block
        for (const block of content) {
          if (block.type === "text" && block.text) {
            // Text content
            this.logger.debug(
              {
                sessionId: this.id,
                blockType: "text",
                textLength: block.text.length,
              },
              "Creating assistant text message"
            );
            results.push({
              id: sdkMessage.uuid || `agent-${Date.now()}-${results.length}`,
              type: "agent",
              content: block.text,
              timestamp,
            });
          } else if (block.type === "tool_use") {
            // Tool use
            this.logger.debug(
              {
                sessionId: this.id,
                blockType: "tool_use",
                toolName: block.name,
                toolId: block.id,
              },
              "Creating tool use message"
            );
            results.push({
              id: sdkMessage.uuid || `tool-${Date.now()}-${results.length}`,
              type: "agent",
              content: "",
              timestamp,
              isToolUse: true,
              toolName: block.name,
              toolInput: block.input ? JSON.stringify(block.input, null, 2) : "",
              toolId: block.id,
              toolResult: null,
            } as any);
          }
        }
      } else {
        // String content (fallback)
        const textContent = this.extractTextContent(content);
        if (textContent) {
          this.logger.debug(
            { sessionId: this.id, contentLength: textContent.length },
            "Creating assistant string message"
          );
          results.push({
            id: sdkMessage.uuid || `agent-${Date.now()}`,
            type: "agent",
            content: textContent,
            timestamp,
          });
        }
      }

      return results;
    }

    // System messages or other types don't need to be exposed
    return [];
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

  /**
   * Generate session summary from messages
   * Priority:
   * 1. First real user message (filtered system messages)
   * 2. Fallback to "New Session"
   *
   * Aligned with Claude Code CLI behavior
   */
  summary(): string {
    const messages = this.getMessages(10); // Get first 10 messages

    // Find first real user message
    const firstUserMsg = messages.find((m) => {
      if (m.type !== "user") return false;

      const content = m.content;

      // Handle ContentBlock[] - not system messages
      if (Array.isArray(content)) {
        return content.length > 0;
      }

      // Handle string content
      const contentStr = content || "";

      // Filter system messages (aligned with Claude Code CLI)
      const isSystemMessage =
        contentStr.startsWith("<command-name>") ||
        contentStr.startsWith("<command-message>") ||
        contentStr.startsWith("<command-args>") ||
        contentStr.startsWith("<local-command-stdout>") ||
        contentStr.startsWith("<system-reminder>") ||
        contentStr.startsWith("Caveat:") ||
        contentStr.startsWith("This session is being continued from a previous") ||
        contentStr === "Warmup";

      return !isSystemMessage && contentStr.length > 0;
    });

    if (firstUserMsg && firstUserMsg.type === "user") {
      // Type guard: UserMessage has content property
      const userMsg = firstUserMsg as UserMessage;
      // Return first 100 characters, add ellipsis if truncated
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
