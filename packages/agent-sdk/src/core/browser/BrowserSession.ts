/**
 * BrowserSession - Client-side Session implementation
 *
 * Provides the same Session interface as the Node.js SDK,
 * but communicates with the server via WebSocket.
 *
 * Usage:
 * ```typescript
 * const session = new BrowserSession(sessionId, wsUrl);
 *
 * // Use exactly like Node.js Session
 * session.on("agent:speaking", ({ chunk }) => {
 *   console.log(chunk);
 * });
 *
 * await session.send("Hello!");
 * ```
 */

import EventEmitter from "eventemitter3";
import type { SessionEvents, AnyMessage, ContentBlock, SessionMetadata, TokenUsage } from "~/types";
import type { ClientMessage, ServerMessage, EventMessage } from "~/types/websocket";

/**
 * Browser-compatible Session implementation
 * Mirrors the Node.js Session API but communicates via WebSocket
 */
export class BrowserSession extends EventEmitter<SessionEvents> {
  public readonly id: string;
  public readonly createdAt: Date;

  private ws!: WebSocket; // Initialized in connect()
  private wsUrl: string;
  private messages: AnyMessage[] = [];
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 5;

  constructor(sessionId: string, wsUrl: string) {
    super();

    this.id = sessionId;
    this.createdAt = new Date();
    this.wsUrl = wsUrl;

    // Connect to WebSocket
    this.connect();
  }

  /**
   * Connect to WebSocket server
   */
  private connect(): void {
    console.log(`[BrowserSession] Connecting to ${this.wsUrl}`);

    this.ws = new WebSocket(this.wsUrl);

    this.ws.onopen = () => {
      console.log(`[BrowserSession] Connected to ${this.wsUrl}`);
      this.isConnected = true;
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      this.handleServerMessage(event.data);
    };

    this.ws.onerror = (error) => {
      console.error("[BrowserSession] WebSocket error:", error);
    };

    this.ws.onclose = () => {
      console.log("[BrowserSession] WebSocket closed");
      this.isConnected = false;
      this.attemptReconnect();
    };
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[BrowserSession] Max reconnect attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`[BrowserSession] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Handle incoming server messages
   */
  private handleServerMessage(data: string): void {
    try {
      const message: ServerMessage = JSON.parse(data);

      if (message.type === "event") {
        this.handleEventMessage(message as EventMessage);
      } else if (message.type === "error") {
        console.error("[BrowserSession] Server error:", message.error);
        this.emit("agent:error", { error: new Error(message.error.message) });
      }
    } catch (error) {
      console.error("[BrowserSession] Failed to parse server message:", error);
    }
  }

  /**
   * Handle event messages from server
   */
  private handleEventMessage(message: EventMessage): void {
    const { eventName, eventData } = message;

    // Store messages locally
    if (
      eventName === "message:user" ||
      eventName === "message:agent" ||
      eventName === "message:tool"
    ) {
      if (eventData.message) {
        this.messages.push(eventData.message);
      }
    }

    // Re-emit the event
    this.emit(eventName as any, eventData);
  }

  /**
   * Send command to server
   */
  private sendCommand(message: ClientMessage): void {
    if (!this.isConnected) {
      throw new Error("WebSocket not connected");
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send a message to the AI model
   */
  async send(content: string | ContentBlock[]): Promise<void> {
    return new Promise((resolve, reject) => {
      // Listen for completion
      const completeHandler = () => {
        this.off("agent:completed", completeHandler);
        this.off("agent:error", errorHandler);
        resolve();
      };

      const errorHandler = ({ error }: { error: Error }) => {
        this.off("agent:completed", completeHandler);
        this.off("agent:error", errorHandler);
        reject(error);
      };

      this.once("agent:completed", completeHandler);
      this.once("agent:error", errorHandler);

      // Send command
      this.sendCommand({
        type: "session:send",
        sessionId: this.id,
        content,
      });
    });
  }

  /**
   * Abort the session
   */
  async abort(): Promise<void> {
    this.sendCommand({
      type: "session:abort",
      sessionId: this.id,
    });
  }

  /**
   * Complete the session
   */
  async complete(): Promise<void> {
    this.sendCommand({
      type: "session:complete",
      sessionId: this.id,
    });
  }

  /**
   * Delete the session
   */
  async delete(): Promise<void> {
    this.sendCommand({
      type: "session:delete",
      sessionId: this.id,
    });
  }

  /**
   * Get messages (local cache)
   */
  getMessages(limit?: number, offset: number = 0): AnyMessage[] {
    const end = limit ? offset + limit : undefined;
    return this.messages.slice(offset, end);
  }

  /**
   * Get token usage (not available in browser, returns empty)
   */
  getTokenUsage(): TokenUsage {
    return {
      used: 0,
      total: 0,
      breakdown: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheCreation: 0,
      },
    };
  }

  /**
   * Get metadata (not available in browser, returns empty)
   */
  getMetadata(): SessionMetadata {
    return {
      projectPath: "",
      startTime: this.createdAt,
    };
  }

  /**
   * Get session summary
   */
  summary(): string {
    const firstUserMsg = this.messages.find((m) => m.type === "user");
    if (firstUserMsg && typeof firstUserMsg.content === "string") {
      return firstUserMsg.content.substring(0, 100);
    }
    return "New Session";
  }

  /**
   * Check if session is active
   */
  isActive(): boolean {
    return this.isConnected;
  }

  /**
   * Check if session is completed
   */
  isCompleted(): boolean {
    return false; // TODO: track state
  }

  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
  }
}
