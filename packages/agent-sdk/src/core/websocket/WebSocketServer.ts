/**
 * WebSocket Server - Core implementation
 *
 * Provides a complete WebSocket server that automatically manages:
 * - Session routing
 * - WebSocketBridge lifecycle
 * - Client connection tracking
 * - Error handling
 */

import http from "http";
import { WebSocketServer } from "ws";
import type { Agent, WebSocketServerConfig, AgentWebSocketServer } from "~/types";
import { WebSocketBridge } from "~/core/websocket/WebSocketBridge";
import type { ClientMessage } from "~/types/websocket";

/**
 * Create a WebSocket server for the agent
 *
 * This creates a complete WebSocket server that automatically:
 * - Routes messages to correct sessions
 * - Creates WebSocketBridge instances for each session
 * - Manages bridge lifecycle
 * - Handles errors
 *
 * @param agent - The Agent instance
 * @param config - Server configuration
 * @returns AgentWebSocketServer instance
 */
export function createWebSocketServer(
  agent: Agent,
  config: WebSocketServerConfig = {}
): AgentWebSocketServer {
  const { port = 5200, host = "0.0.0.0", path = "/ws", server: existingServer } = config;

  // Track bridges per connection (multiple sessions per client)
  const connectionBridges = new WeakMap<import("ws").WebSocket, Map<string, WebSocketBridge>>();

  // Create HTTP server if not provided
  const httpServer = existingServer || http.createServer();

  // Create WebSocket server
  const wss = new WebSocketServer({
    server: httpServer,
    path,
    perMessageDeflate: false, // Disable compression to avoid frame errors
  });

  // Handle WebSocket connections
  wss.on("connection", (ws: import("ws").WebSocket) => {
    console.log(`[AgentWebSocketServer] Client connected to ${path}`);

    // Initialize bridges map for this connection
    const bridges = new Map<string, WebSocketBridge>();
    connectionBridges.set(ws, bridges);

    // Handle incoming messages
    ws.on("message", async (data: import("ws").RawData) => {
      try {
        const message: ClientMessage = JSON.parse(data.toString());
        const { sessionId } = message;

        if (!sessionId) {
          throw new Error("sessionId is required in all messages");
        }

        // Get or create session
        let session = agent.getSession(sessionId);

        if (!session) {
          // Create new session if it doesn't exist
          session = await agent.createSession({ id: sessionId });
        }

        // Create bridge if not exists (auto-forwards all events)
        if (!bridges.has(sessionId)) {
          console.log(`[AgentWebSocketServer] Creating bridge for session: ${sessionId}`);
          const bridge = new WebSocketBridge(session, ws);
          bridges.set(sessionId, bridge);
        }

        // Bridge will automatically handle the message
        // No need to manually route - WebSocketBridge handles it!
      } catch (error) {
        console.error("[AgentWebSocketServer] Error handling message:", error);

        // Send error back to client
        ws.send(
          JSON.stringify({
            type: "error",
            sessionId: "",
            error: {
              message: error instanceof Error ? error.message : "Unknown error",
            },
          })
        );
      }
    });

    // Handle client disconnect
    ws.on("close", () => {
      console.log("[AgentWebSocketServer] Client disconnected");

      // Clean up all bridges for this connection
      const bridges = connectionBridges.get(ws);
      if (bridges) {
        bridges.forEach((bridge) => {
          bridge.destroy();
        });
        bridges.clear();
      }
    });

    // Handle errors
    ws.on("error", (error: Error) => {
      console.error("[AgentWebSocketServer] WebSocket error:", error);
    });
  });

  // Start HTTP server if we created it
  if (!existingServer) {
    httpServer.listen(port, host, () => {
      console.log(`[AgentWebSocketServer] Listening on ws://${host}:${port}${path}`);
    });
  }

  // Return server instance
  return {
    port,
    host,
    async close(): Promise<void> {
      return new Promise((resolve, reject) => {
        wss.close((err?: Error) => {
          if (err) {
            reject(err);
          } else {
            // Also close HTTP server if we created it
            if (!existingServer) {
              httpServer.close(() => {
                console.log("[AgentWebSocketServer] Server closed");
                resolve();
              });
            } else {
              resolve();
            }
          }
        });
      });
    },
  };
}
