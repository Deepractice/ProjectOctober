/**
 * Sessions Watcher - Using Agent SDK
 * Subscribes to session events and notifies WebSocket clients
 */
import { WebSocket } from "ws";
import { getAgent } from "../agent.js";
import { logger } from "../utils/logger.js";

let sessionSubscription = null;

export async function setupSessionsWatcher(connectedClients) {
  if (sessionSubscription) {
    sessionSubscription.unsubscribe();
  }

  try {
    const agent = await getAgent();

    // Subscribe to session events
    sessionSubscription = agent.sessions$().subscribe({
      next: (event) => {
        logger.info(`📡 Session event: ${event.type} - ${event.sessionId}`);

        // Broadcast to WebSocket clients
        broadcastSessionEvent(connectedClients, event);
      },
      error: (err) => {
        logger.error("❌ Session events error:", err);
      },
    });

    logger.info("✅ Sessions watcher ready (subscribed to SDK events)");
  } catch (error) {
    logger.error("❌ Failed to setup sessions watcher:", error);
  }
}

async function broadcastSessionEvent(connectedClients, event) {
  try {
    // Fetch current sessions
    const agent = await getAgent();
    const sessions = agent.getSessions(100, 0);

    // Format sessions for frontend (same format as REST API)
    const formatted = sessions.map((s) => ({
      id: s.id,
      summary: s.summary(),
      messageCount: s.getMessages().length,
      lastActivity: s.getMetadata().startTime,
      cwd: s.getMetadata().projectPath,
    }));

    const message = JSON.stringify({
      type: "sessions_updated",
      sessions: formatted, // Include full sessions array
      event: event.type,
      sessionId: event.sessionId,
      timestamp: new Date().toISOString(),
    });

    let broadcastCount = 0;
    connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
        broadcastCount++;
      }
    });

    logger.info(`   Broadcast ${formatted.length} sessions to ${broadcastCount} clients`);
  } catch (error) {
    logger.error("Failed to broadcast session event:", error);
  }
}

export function closeSessionsWatcher() {
  if (sessionSubscription) {
    sessionSubscription.unsubscribe();
    sessionSubscription = null;
  }
}
