/**
 * connectionStore - WebSocket Connection Layer
 *
 * Pure WebSocket connection management without business logic.
 * Handles connection, reconnection, and message forwarding to messageStore.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ConnectionState } from "../types";

export const useConnectionStore = create<ConnectionState>()(
  devtools(
    (set, get) => ({
      // State
      ws: null,
      isConnected: false,
      reconnectAttempts: 0,
      reconnectTimeout: null,

      // Connect to WebSocket
      connect: async () => {
        try {
          // Get authentication token (optional for internal network deployment)
          const token = localStorage.getItem("auth-token");
          if (!token) {
            console.warn(
              "No authentication token found, connecting without auth (internal network mode)"
            );
          }

          // Fetch server configuration to get the correct WebSocket URL
          let wsBaseUrl;
          try {
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const configResponse = await fetch("/api/config", { headers });
            const config = await configResponse.json();
            wsBaseUrl = config.wsUrl;

            // If the config returns localhost but we're not on localhost, use current host but with API server port
            if (
              wsBaseUrl.includes("localhost") &&
              !window.location.hostname.includes("localhost")
            ) {
              const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
              // For development, API server is typically on port 3002 when Vite is on 3001
              const apiPort = window.location.port === "3001" ? "3002" : window.location.port;
              wsBaseUrl = `${protocol}//${window.location.hostname}:${apiPort}`;
            }
          } catch (error) {
            console.warn(
              "Could not fetch server config, falling back to current host with API server port"
            );
            const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
            // For development, API server is typically on port 3002 when Vite is on 3001
            const apiPort = window.location.port === "3001" ? "3002" : window.location.port;
            wsBaseUrl = `${protocol}//${window.location.hostname}:${apiPort}`;
          }

          // Include token in WebSocket URL as query parameter (if available)
          const wsUrl = token
            ? `${wsBaseUrl}/ws?token=${encodeURIComponent(token)}`
            : `${wsBaseUrl}/ws`;
          const websocket = new WebSocket(wsUrl);

          websocket.onopen = () => {
            console.log("✅ WebSocket connected");
            set({ isConnected: true, ws: websocket, reconnectAttempts: 0 });
          };

          websocket.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);

              console.log("📨 WebSocket message received:", {
                type: data.type,
                sessionId: data.sessionId,
                timestamp: new Date().toISOString(),
              });

              // Forward message to messageStore
              // Import dynamically to avoid circular dependency
              import("./messageStore").then(({ useMessageStore }) => {
                useMessageStore.getState().handleMessage(data);
              });
            } catch (error) {
              console.error("Error parsing WebSocket message:", error);
            }
          };

          websocket.onclose = () => {
            console.log("❌ WebSocket disconnected");
            set({ isConnected: false, ws: null });

            // Attempt to reconnect
            get().reconnect();
          };

          websocket.onerror = (error) => {
            console.error("WebSocket error:", error);
          };

          set({ ws: websocket });
        } catch (error) {
          console.error("Error creating WebSocket connection:", error);
        }
      },

      // Reconnect with exponential backoff
      reconnect: () => {
        const attempts = get().reconnectAttempts;
        if (attempts >= 5) {
          console.error("Max reconnection attempts reached");
          return;
        }

        const delay = Math.min(1000 * 2 ** attempts, 30000);
        console.log(`Reconnecting in ${delay}ms (attempt ${attempts + 1}/5)`);

        const timeout = setTimeout(() => {
          set({ reconnectAttempts: attempts + 1 });
          get().connect();
        }, delay);

        set({ reconnectTimeout: timeout });
      },

      // Send message through WebSocket
      send: (message) => {
        const { ws, isConnected } = get();
        if (ws && isConnected) {
          ws.send(JSON.stringify(message));
        } else {
          console.warn("WebSocket not connected, cannot send message");
        }
      },

      // Disconnect WebSocket
      disconnect: () => {
        const { ws, reconnectTimeout } = get();

        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }

        if (ws) {
          ws.close();
        }

        set({ ws: null, isConnected: false, reconnectAttempts: 0, reconnectTimeout: null });
      },
    }),
    { name: "ConnectionStore" }
  )
);
