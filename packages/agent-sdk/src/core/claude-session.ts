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
  private streamEventSubject = new Subject<SDKMessage>();
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
    logger: Logger,
    initialMessages: AnyMessage[] = [],
    initialTokenUsage?: TokenUsage
  ) {
    this.id = id;
    this.createdAt = new Date();
    this.metadata = metadata;
    this.adapter = adapter;
    this.options = options;
    this.logger = logger;

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
      {
        sessionId: this.id,
        contentPreview: content.substring(0, 50),
        contentLength: content.length,
        currentMessagesCount: this.messages.length,
        hasRealSessionId: !!this.realSessionId,
        state: this._state,
      },
      "Send called"
    );

    // ✅ FIX: Manually add user message BEFORE sending to Claude SDK
    // Claude SDK doesn't return user messages in the stream, so we must add it ourselves
    const userMessage: AnyMessage = {
      id: randomUUID(),
      type: "user",
      content,
      timestamp: new Date(),
    };

    this.logger.debug(
      {
        sessionId: this.id,
        messageId: userMessage.id,
        contentPreview: content.substring(0, 50),
      },
      "Adding user message to internal storage"
    );

    this.messages.push(userMessage);

    // ✅ REFACTOR: Send to streamEventSubject instead of messageSubject
    // Frontend will receive this via WebSocket streaming
    this.streamEventSubject.next({
      type: "user",
      message: {
        role: "user",
        content: userMessage.content,
      },
      uuid: userMessage.id,
    } as any);

    this.logger.debug(
      { sessionId: this.id, totalMessages: this.messages.length },
      "User message stored and forwarded to stream"
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
            { sessionId: this.id, realSessionId: this.realSessionId },
            "Captured real session ID from SDK"
          );
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
      this.logger.error(
        { err: error, sessionId: this.id, contentLength: content.length },
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

    // ✅ REFACTOR: Forward ALL SDK messages to streamEventSubject for real-time WebSocket streaming
    // This is the single source of truth for real-time communication
    this.streamEventSubject.next(sdkMessage);
    this.logger.debug(
      { sessionId: this.id, sdkType: sdkMessage.type },
      "Forwarded SDK message to streamEventSubject"
    );

    // Transform and store messages internally for getMessages() API
    // This maintains historical messages for REST API queries
    const messages = this.transformSDKMessage(sdkMessage);

    if (messages && messages.length > 0) {
      this.logger.debug(
        { sessionId: this.id, transformedCount: messages.length },
        "Transformed messages for internal storage"
      );

      for (const message of messages) {
        const msg = message as any;
        this.logger.debug(
          {
            sessionId: this.id,
            messageType: message.type,
            messageId: message.id,
            isToolUse: msg.isToolUse,
            toolName: msg.toolName,
            contentPreview: msg.content?.substring(0, 50),
          },
          "Storing message internally"
        );

        // Only store in messages[] array, DO NOT emit to messageSubject
        // Frontend will receive this via streamEventSubject
        this.messages.push(message);
      }

      this.logger.debug(
        { sessionId: this.id, totalMessages: this.messages.length },
        "Messages stored in internal array"
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

      // Check if this is a tool result message
      if (Array.isArray(content)) {
        const hasToolResult = content.some((block) => block.type === "tool_result");
        if (hasToolResult) {
          // Process tool results and update existing tool use messages
          this.logger.debug(
            { sessionId: this.id, blockCount: content.length },
            "Processing tool_result blocks"
          );

          for (const block of content) {
            if (block.type === "tool_result") {
              // Find the corresponding tool use message by toolId
              const toolUseMsg = this.messages.find(
                (msg: any) => msg.isToolUse && msg.toolId === block.tool_use_id
              );

              if (toolUseMsg) {
                this.logger.debug(
                  {
                    sessionId: this.id,
                    toolId: block.tool_use_id,
                    isError: block.is_error || false,
                    contentLength: String(block.content).length,
                  },
                  "Updating tool result for existing tool use message"
                );

                // Update the tool result on the existing message
                (toolUseMsg as any).toolResult = {
                  content: block.content,
                  isError: block.is_error || false,
                  timestamp: new Date(),
                  toolUseResult: block,
                };

                // ✅ FIX: Don't re-emit the message - frontend handles tool_result separately
                // The WebSocketAdapter already emits message.toolResult event for UI updates
                // Re-emitting causes duplicate messages in the WebSocket stream
              } else {
                this.logger.warn(
                  { sessionId: this.id, toolId: block.tool_use_id },
                  "Could not find matching tool use message for tool_result"
                );
              }
            }
          }

          // Don't create a separate user message for tool results
          return [];
        }
      }

      // Regular user message
      const textContent = this.extractTextContent(content);
      this.logger.debug(
        {
          sessionId: this.id,
          contentLength: textContent.length,
          contentPreview: textContent.substring(0, 50),
        },
        "Creating user message"
      );

      results.push({
        id: sdkMessage.uuid || `user-${Date.now()}`,
        type: "user",
        content: textContent,
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
              id: sdkMessage.uuid || `assistant-${Date.now()}-${results.length}`,
              type: "assistant",
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
              type: "assistant",
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
            id: sdkMessage.uuid || `assistant-${Date.now()}`,
            type: "assistant",
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

    this.logger.info({ sessionId: this.id }, "Aborting active request via adapter interrupt");

    // Interrupt the Claude SDK query
    try {
      await this.adapter.interrupt();
      this.logger.info({ sessionId: this.id }, "Claude SDK query interrupted successfully");
    } catch (error) {
      this.logger.error({ sessionId: this.id, err: error }, "Failed to interrupt query");
    }

    // Set to idle instead of aborted
    // Abort only stops the current streaming request, session can continue
    this._state = "idle";
    // Do NOT complete the messageSubject
    // Complete would permanently close the Subject, preventing future messages
    // The Subject should only be completed when the session is truly done (delete/complete)
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

  streamEvents$(): Observable<SDKMessage> {
    return this.streamEventSubject.asObservable();
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

      const content = m.content || "";

      // Filter system messages (aligned with Claude Code CLI)
      const isSystemMessage =
        content.startsWith("<command-name>") ||
        content.startsWith("<command-message>") ||
        content.startsWith("<command-args>") ||
        content.startsWith("<local-command-stdout>") ||
        content.startsWith("<system-reminder>") ||
        content.startsWith("Caveat:") ||
        content.startsWith("This session is being continued from a previous") ||
        content === "Warmup";

      return !isSystemMessage && content.length > 0;
    });

    if (firstUserMsg && firstUserMsg.type === "user") {
      // Type guard: UserMessage has content property
      const userMsg = firstUserMsg as UserMessage;
      // Return first 100 characters, add ellipsis if truncated
      const summary = userMsg.content.substring(0, 100);
      return userMsg.content.length > 100 ? `${summary}...` : summary;
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
