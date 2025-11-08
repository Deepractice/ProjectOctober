/**
 * VirtualSession - Lightweight Session implementation for browser
 *
 * Doesn't maintain its own WebSocket connection.
 * Instead, routes all commands through BrowserAgent's shared WebSocket.
 *
 * Provides the same Session API as Node.js SDK.
 */

import EventEmitter from "eventemitter3";
import type {
  Session,
  SessionEvents,
  SessionState,
  AnyMessage,
  ContentBlock,
  SessionMetadata,
  TokenUsage,
} from "~/types";
import type { BrowserAgent } from "./BrowserAgent";

/**
 * Virtual Session - Routes through BrowserAgent's WebSocket
 * Implements the same Session interface as Node.js SDK
 */
export class VirtualSession extends EventEmitter<SessionEvents> implements Session {
  public readonly id: string;
  public readonly createdAt: Date;
  public readonly state: SessionState = "created";

  private agent: BrowserAgent;
  private messages: AnyMessage[] = [];

  constructor(sessionId: string, agent: BrowserAgent) {
    super();

    this.id = sessionId;
    this.createdAt = new Date();
    this.agent = agent;

    console.log(`[VirtualSession] Created session: ${sessionId}`);
  }

  /**
   * Internal method: emit event (called by BrowserAgent)
   */
  _emitEvent(eventName: string, eventData: any): void {
    // Store messages locally for getMessages()
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
   * Internal method: cleanup (called by BrowserAgent)
   */
  _cleanup(): void {
    this.removeAllListeners();
    this.messages = [];
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

      // Send command through agent's WebSocket
      try {
        this.agent._sendCommand({
          type: "session:send",
          sessionId: this.id,
          content,
        });
      } catch (error) {
        this.off("agent:completed", completeHandler);
        this.off("agent:error", errorHandler);
        reject(error);
      }
    });
  }

  /**
   * Abort the session
   */
  async abort(): Promise<void> {
    this.agent._sendCommand({
      type: "session:abort",
      sessionId: this.id,
    });
  }

  /**
   * Complete the session
   */
  async complete(): Promise<void> {
    this.agent._sendCommand({
      type: "session:complete",
      sessionId: this.id,
    });
  }

  /**
   * Delete the session
   */
  async delete(): Promise<void> {
    this.agent._sendCommand({
      type: "session:delete",
      sessionId: this.id,
    });

    // Remove from agent
    this.agent.removeSession(this.id);
  }

  /**
   * Get messages observable (not available in browser)
   * Optional method from Session interface
   */
  messages$(): any {
    throw new Error("messages$() not available in VirtualSession. Use event listeners instead.");
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
      const summary = firstUserMsg.content.substring(0, 100);
      return firstUserMsg.content.length > 100 ? `${summary}...` : summary;
    }
    return "New Session";
  }

  /**
   * Check if session is active
   */
  isActive(): boolean {
    return this.agent.isAgentConnected();
  }

  /**
   * Check if session is completed
   */
  isCompleted(): boolean {
    return false; // TODO: track state
  }
}
