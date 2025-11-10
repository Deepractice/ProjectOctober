/**
 * Agent WebSocket Handler - Using SDK WebSocketBridge
 */
import type { WebSocket } from "ws";
import type { Agent } from "@deepractice-ai/agent-sdk";
import { WebSocketBridge } from "@deepractice-ai/agent-sdk/server";
import type { ConnectedClients } from "../types.js";

// Track bridges per connection
const connectionBridges = new WeakMap<WebSocket, Map<string, any>>();

/**
 * Handle agent WebSocket connection
 * Creates WebSocketBridge instances for each session
 */
export function handleAgentConnection(
  ws: WebSocket,
  agent: Agent,
  connectedClients: ConnectedClients
) {
  console.log("💬 Agent WebSocket connected");
  connectedClients.add(ws);

  // Initialize bridges map for this connection
  const bridges = new Map<string, any>();
  connectionBridges.set(ws, bridges);

  // Handle incoming messages
  ws.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString());
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
        console.log(`[AgentWebSocket] Creating bridge for session: ${sessionId}`);
        const bridge = new WebSocketBridge(session, ws);
        bridges.set(sessionId, bridge);
      }

      // Bridge will automatically handle the message
    } catch (error) {
      console.error("[AgentWebSocket] Error handling message:", error);

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
    console.log("[AgentWebSocket] Client disconnected");
    connectedClients.delete(ws);

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
  ws.on("error", (error) => {
    console.error("[AgentWebSocket] WebSocket error:", error);
  });
}
