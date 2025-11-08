/**
 * WebSocketBridge - Server-side bridge for Session EventEmitter
 *
 * Automatically converts Session EventEmitter events to WebSocket messages
 * Handles incoming WebSocket commands and routes them to Session methods
 *
 * Usage:
 * ```typescript
 * const bridge = new WebSocketBridge(session, ws);
 * // Now all session events are automatically sent to the WebSocket client
 * // And WebSocket messages are routed to session methods
 * ```
 */

import type { Session, SessionEvents } from "~/types";
import type { ClientMessage, ServerMessage, WebSocketMessage } from "~/types/websocket";
import { createEventMessage, createErrorMessage } from "~/types/websocket";

/**
 * WebSocket-like interface (works with ws and native WebSocket)
 */
export interface WebSocketLike {
  send(data: string): void;
  on?(event: string, handler: (...args: any[]) => void): void;
  addEventListener?(event: string, handler: (event: any) => void): void;
  close(): void;
}

/**
 * WebSocket Bridge for Session
 *
 * Responsibilities:
 * - Subscribe to ALL session events
 * - Convert events to WebSocket messages
 * - Handle incoming WebSocket commands
 * - Clean up on disconnect
 */
export class WebSocketBridge {
  private session: Session;
  private ws: WebSocketLike;
  private eventHandlers: Map<string, (...args: any[]) => void> = new Map();

  constructor(session: Session, ws: WebSocketLike) {
    this.session = session;
    this.ws = ws;

    this.setupEventForwarding();
    this.setupCommandHandling();
  }

  /**
   * Setup event forwarding: Session events → WebSocket messages
   */
  private setupEventForwarding(): void {
    // List of all SessionEvents to forward
    const eventNames: Array<keyof SessionEvents> = [
      // Agent state events
      "agent:idle",
      "agent:thinking",
      "agent:speaking",
      "agent:tool_calling",
      "agent:tool_waiting",
      "agent:error",
      "agent:completed",
      // Message events
      "message:user",
      "message:agent",
      "message:tool",
      // Stream events
      "stream:start",
      "stream:chunk",
      "stream:end",
      // Session lifecycle events
      "session:created",
      "session:active",
      "session:idle",
      "session:completed",
      "session:error",
      "session:deleted",
      // Persistence events
      "persist:message:start",
      "persist:message:success",
      "persist:message:error",
      "persist:session:start",
      "persist:session:success",
      "persist:session:error",
    ];

    // Subscribe to each event
    eventNames.forEach((eventName) => {
      const handler = (eventData: any) => {
        this.sendEvent(eventName, eventData);
      };

      this.session.on(eventName as any, handler);
      this.eventHandlers.set(eventName, handler);
    });
  }

  /**
   * Setup command handling: WebSocket messages → Session methods
   */
  private setupCommandHandling(): void {
    const messageHandler = (data: any) => {
      try {
        // Parse WebSocket message (support both string and Buffer)
        const message: WebSocketMessage =
          typeof data === "string" ? JSON.parse(data) : JSON.parse(data.toString());

        this.handleClientMessage(message as ClientMessage);
      } catch (error) {
        console.error("[WebSocketBridge] Failed to parse message:", error);
        this.sendError(error as Error);
      }
    };

    // Support both ws (Node.js) and native WebSocket (browser)
    if (this.ws.on) {
      // Node.js ws library
      this.ws.on("message", messageHandler);
    } else if (this.ws.addEventListener) {
      // Native WebSocket
      this.ws.addEventListener("message", (event: any) => {
        messageHandler(event.data);
      });
    }
  }

  /**
   * Handle incoming client messages
   */
  private async handleClientMessage(message: ClientMessage): Promise<void> {
    try {
      switch (message.type) {
        case "session:send":
          await this.session.send(message.content);
          break;

        case "session:abort":
          await this.session.abort();
          break;

        case "session:complete":
          await this.session.complete();
          break;

        case "session:delete":
          await this.session.delete();
          break;

        default:
          throw new Error(`Unknown message type: ${(message as any).type}`);
      }
    } catch (error) {
      console.error("[WebSocketBridge] Command failed:", error);
      this.sendError(error as Error);
    }
  }

  /**
   * Send session event to client
   */
  private sendEvent(eventName: string, eventData: any): void {
    const message = createEventMessage(this.session.id, eventName, eventData);
    this.send(message);
  }

  /**
   * Send error to client
   */
  private sendError(error: Error): void {
    const message = createErrorMessage(this.session.id, error);
    this.send(message);
  }

  /**
   * Send message to WebSocket client
   */
  private send(message: ServerMessage): void {
    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error("[WebSocketBridge] Failed to send message:", error);
    }
  }

  /**
   * Clean up: remove all event listeners
   */
  destroy(): void {
    // Remove all event listeners from session
    this.eventHandlers.forEach((handler, eventName) => {
      this.session.off(eventName as any, handler);
    });

    this.eventHandlers.clear();

    console.log(`[WebSocketBridge] Destroyed bridge for session ${this.session.id}`);
  }
}
