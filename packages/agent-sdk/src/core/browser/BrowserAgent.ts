/**
 * BrowserAgent - Browser-side Agent implementation
 *
 * Manages a single WebSocket connection and multiplexes multiple sessions.
 * Mirrors the Node.js Agent API but communicates via WebSocket.
 *
 * Architecture:
 * - Single WebSocket connection to server
 * - Multiple VirtualSession instances (one per session)
 * - Automatic message routing based on sessionId
 *
 * Usage:
 * ```typescript
 * const agent = new BrowserAgent("ws://localhost:5200/ws");
 * await agent.initialize();
 *
 * const session = agent.getSession("session-id");
 * session.on("agent:speaking", ({ chunk }) => {
 *   console.log(chunk);
 * });
 *
 * await session.send("Hello!");
 * ```
 */

import EventEmitter from "eventemitter3";
import type { Agent, SessionCreateOptions, Session } from "~/types";
import type { ServerMessage, EventMessage } from "~/types/websocket";
import { VirtualSession } from "./VirtualSession";

export interface BrowserAgentConfig {
  wsUrl: string;
  reconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

/**
 * Browser-compatible Agent implementation
 * Implements the same Agent interface as Node.js SDK
 * Manages single WebSocket + multiple sessions
 */
export class BrowserAgent extends EventEmitter implements Agent {
  private config: Required<BrowserAgentConfig>;
  private ws!: WebSocket;
  private sessions: Map<string, VirtualSession> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private isInitialized: boolean = false;

  constructor(wsUrl: string, config?: Partial<BrowserAgentConfig>) {
    super();

    this.config = {
      wsUrl,
      reconnect: config?.reconnect ?? true,
      reconnectDelay: config?.reconnectDelay ?? 1000,
      maxReconnectAttempts: config?.maxReconnectAttempts ?? 5,
    };

    console.log("[BrowserAgent] Created with config:", this.config);
  }

  /**
   * Initialize the agent (connect to WebSocket)
   * Implements Agent interface
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn("[BrowserAgent] Already initialized");
      return;
    }

    await this.connect();
    this.isInitialized = true;

    console.log("[BrowserAgent] Initialized successfully");
  }

  /**
   * Connect to WebSocket server
   */
  private connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log(`[BrowserAgent] Connecting to ${this.config.wsUrl}`);

      this.ws = new WebSocket(this.config.wsUrl);

      this.ws.onopen = () => {
        console.log(`[BrowserAgent] Connected to ${this.config.wsUrl}`);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit("connected");
        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleServerMessage(event.data);
      };

      this.ws.onerror = (error) => {
        console.error("[BrowserAgent] WebSocket error:", error);
        this.emit("error", error);
        reject(error);
      };

      this.ws.onclose = () => {
        console.log("[BrowserAgent] WebSocket closed");
        this.isConnected = false;
        this.emit("disconnected");
        this.attemptReconnect();
      };
    });
  }

  /**
   * Attempt to reconnect to WebSocket
   */
  private attemptReconnect(): void {
    if (!this.config.reconnect) {
      return;
    }

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error("[BrowserAgent] Max reconnect attempts reached");
      this.emit("reconnect-failed");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`[BrowserAgent] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.emit("reconnecting", { attempt: this.reconnectAttempts, delay });

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("[BrowserAgent] Reconnect failed:", error);
      });
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
        console.error("[BrowserAgent] Server error:", message.error);
        // Route error to specific session if sessionId exists
        if (message.sessionId) {
          const session = this.sessions.get(message.sessionId);
          if (session) {
            session._emitEvent("agent:error", {
              error: new Error(message.error.message),
            });
          }
        }
      }
    } catch (error) {
      console.error("[BrowserAgent] Failed to parse server message:", error);
    }
  }

  /**
   * Handle event messages from server and route to sessions
   */
  private handleEventMessage(message: EventMessage): void {
    const { sessionId, eventName, eventData } = message;

    // Get the session
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[BrowserAgent] Received event for unknown session: ${sessionId}`);
      return;
    }

    // Route event to session
    session._emitEvent(eventName, eventData);
  }

  /**
   * Send command to server
   * Internal method used by VirtualSession
   */
  _sendCommand(message: any): void {
    if (!this.isConnected) {
      throw new Error("WebSocket not connected");
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Get or create a session
   * Implements Agent interface
   */
  getSession(sessionId: string): Session | null {
    if (!this.sessions.has(sessionId)) {
      console.log("[BrowserAgent] Creating new VirtualSession:", sessionId);

      const session = new VirtualSession(sessionId, this);
      this.sessions.set(sessionId, session);
    }

    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all sessions
   * Implements Agent interface
   */
  getSessions(_limit?: number, _offset?: number): Session[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Create a new session
   * Implements Agent interface
   *
   * Note: In browser, session creation happens server-side via HTTP API.
   * This method creates a client-side session proxy.
   */
  async createSession(options?: SessionCreateOptions): Promise<Session> {
    // Generate session ID if not provided
    const sessionId =
      options?.id || `session-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    // Note: Actual session creation should happen server-side via HTTP API
    // This just creates the client-side proxy
    console.warn(
      "[BrowserAgent] createSession() creates client-side proxy only. " +
        "Ensure session exists on server (created via HTTP API)."
    );

    const session = new VirtualSession(sessionId, this);
    this.sessions.set(sessionId, session);

    return session;
  }

  /**
   * Quick chat API (not implemented in browser)
   * Implements Agent interface
   */
  async chat(_message: string): Promise<Session> {
    throw new Error("chat() not available in BrowserAgent. Use createSession() + session.send()");
  }

  /**
   * Get sessions observable (not implemented in browser)
   * Implements Agent interface
   */
  sessions$(): any {
    throw new Error("sessions$() not available in BrowserAgent");
  }

  /**
   * Get agent status (simplified for browser)
   * Implements Agent interface
   */
  getStatus(): any {
    return {
      ready: this.isConnected,
      warmupPoolSize: 0,
      activeSessions: this.sessions.size,
      metrics: {
        avgResponseTime: 0,
        totalSessions: this.sessions.size,
        cacheHitRate: 0,
      },
    };
  }

  /**
   * Delete a session
   * Implements Agent interface
   */
  async deleteSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      await session.delete();
    }
  }

  /**
   * Get all session IDs
   */
  getSessionIds(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Check if session exists
   * Implements Agent interface
   */
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /**
   * Remove session (internal method)
   */
  removeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session._cleanup();
      this.sessions.delete(sessionId);
      console.log("[BrowserAgent] Removed session:", sessionId);
    }
  }

  /**
   * Disconnect and clean up
   */
  async destroy(): Promise<void> {
    console.log("[BrowserAgent] Destroying agent");

    // Clean up all sessions
    this.sessions.forEach((session) => {
      session._cleanup();
    });
    this.sessions.clear();

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
    }

    this.isInitialized = false;
    this.emit("destroyed");

    console.log("[BrowserAgent] Agent destroyed");
  }

  /**
   * Check if agent is connected
   */
  isAgentConnected(): boolean {
    return this.isConnected;
  }
}
