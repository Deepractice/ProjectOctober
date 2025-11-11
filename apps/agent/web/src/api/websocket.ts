/**
 * WebSocket Client
 * Manages WebSocket connection and forwards messages to EventBus
 */

import { adaptWebSocketToEventBus } from "~/core/websocketAdapter";
import { eventBus } from "~/core/eventBus";

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    // If already connected or connecting, return existing connection
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      console.log("[WebSocket] Already connected/connecting, skipping");
      return Promise.resolve();
    }

    // Disconnect any existing connection first
    if (this.ws) {
      console.log("[WebSocket] Closing existing connection before reconnect");
      this.disconnect();
    }

    return new Promise((resolve, reject) => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      console.log("[WebSocket] Connecting to:", wsUrl);
      this.ws = new WebSocket(wsUrl);

      // Connection timeout - 10 seconds
      this.connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
          console.error("[WebSocket] ⏱️ Connection timeout");
          this.ws.close();
          reject(new Error("WebSocket connection timeout"));
        }
      }, 10000);

      this.ws.onopen = () => {
        console.log("[WebSocket] ✅ Connected");
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        this.reconnectAttempts = 0;
        resolve();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          adaptWebSocketToEventBus(message);
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.error("[WebSocket] ❌ Error:", error);
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        eventBus.emit({ type: "error.websocket", error: new Error("WebSocket error") });
        reject(error);
      };

      this.ws.onclose = (event) => {
        console.log("[WebSocket] 🔌 Closed", {
          code: event.code,
          reason: event.reason || "(no reason)",
          wasClean: event.wasClean,
        });
        if (this.connectionTimeout) {
          clearTimeout(this.connectionTimeout);
          this.connectionTimeout = null;
        }
        this.reconnect();
      };
    });
  }

  /**
   * Send message to WebSocket server
   */
  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error("[WebSocket] Not connected, cannot send message");
    }
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    console.log("[WebSocket] Disconnected");
  }

  /**
   * Reconnect with exponential backoff
   */
  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      // Start with 5s delay, then exponential backoff: 5s, 10s, 20s, 30s, 30s
      const delay = Math.min(5000 * Math.pow(2, this.reconnectAttempts - 1), 30000);
      console.log(
        `[WebSocket] 🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      this.reconnectTimeout = setTimeout(() => {
        this.connect().catch((error) => {
          console.error("[WebSocket] Reconnect failed:", error);
        });
      }, delay);
    } else {
      console.error("[WebSocket] ❌ Max reconnect attempts reached");
      eventBus.emit({
        type: "error.websocket",
        error: new Error("WebSocket connection failed after max retries"),
      });
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const wsClient = new WebSocketClient();
