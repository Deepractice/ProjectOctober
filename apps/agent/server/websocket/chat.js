/**
 * Chat WebSocket Handler - Using Agent SDK
 */
import { getAgent } from "../agent.js";

export function handleChatConnection(ws, connectedClients) {
  console.log("💬 Chat WebSocket connected");
  connectedClients.add(ws);

  // Setup heartbeat - ping every 30 seconds
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.ping();
    }
  }, 30000);

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "agent-command") {
        const sessionId = data.options?.sessionId;
        const agent = await getAgent();

        console.log("🔵 [WebSocket] Received agent-command:", {
          sessionId,
          commandPreview: data.command.substring(0, 50) + "...",
          hasSessionId: !!sessionId,
        });

        try {
          // sessionId is now REQUIRED - sessions are only created via POST /api/sessions/create
          if (!sessionId) {
            throw new Error(
              "sessionId is required. Use POST /api/sessions/create with message to create new session."
            );
          }

          // Resume existing session
          console.log("🔵 [WebSocket] Resuming existing session:", sessionId);
          const session = agent.getSession(sessionId);
          if (!session) {
            throw new Error(`Session ${sessionId} not found`);
          }

          // ✅ GUARD: Check session state before sending
          if (session.isCompleted()) {
            console.warn("⚠️ [WebSocket] Session is already completed/error:", {
              sessionId: session.id,
              state: session.state,
            });
            ws.send(
              JSON.stringify({
                type: "claude-error",
                sessionId: session.id,
                error: `Session is no longer active (state: ${session.state})`,
                recoverable: false,
                state: session.state,
              })
            );
            return;
          }

          console.log(
            "🔵 [WebSocket] Session found, current messages:",
            session.getMessages().length
          );

          // ✅ REFACTOR: Remove subscription - messages are broadcast via sessions-broadcast
          // All real-time messages will be sent by sessions-broadcast.js
          // This prevents duplicate messages and simplifies the architecture

          // Send message
          console.log("🔵 [WebSocket] Calling session.send()...");
          console.log("🔵 [WebSocket] Messages will be broadcast via sessions-broadcast");
          await session.send(data.command);

          console.log("🔵 [WebSocket] session.send() completed:", {
            sessionId: session.id,
            totalMessages: session.getMessages().length,
          });

          // After send completes, notify frontend
          ws.send(
            JSON.stringify({
              type: "agent-complete",
              sessionId: session.id,
              exitCode: 0,
            })
          );
        } catch (error) {
          // Check session state to determine if error is recoverable
          const session = agent.getSession(sessionId);
          const sessionState = session ? session.state : "unknown";
          const isRecoverable = sessionState === "idle"; // If still idle, error was recoverable

          console.error("❌ [WebSocket] Error sending message:", {
            sessionId,
            error: error.message,
            state: sessionState,
            recoverable: isRecoverable,
          });

          ws.send(
            JSON.stringify({
              type: "claude-error",
              sessionId,
              error: error.message,
              recoverable: isRecoverable,
              state: sessionState,
            })
          );
        }
      } else if (data.type === "abort-session") {
        const agent = await getAgent();
        const session = agent.getSession(data.sessionId);

        if (session) {
          await session.abort();
          ws.send(
            JSON.stringify({
              type: "session-aborted",
              sessionId: data.sessionId,
              success: true,
            })
          );
        }
      } else if (data.type === "check-session-status") {
        const agent = await getAgent();
        const session = agent.getSession(data.sessionId);

        ws.send(
          JSON.stringify({
            type: "session-status",
            sessionId: data.sessionId,
            isProcessing: session ? session.isActive() : false,
          })
        );
      } else if (data.type === "get-active-sessions") {
        const agent = await getAgent();
        const activeSessions = agent
          .getSessions(100, 0)
          .filter((s) => s.isActive())
          .map((s) => s.id);

        ws.send(
          JSON.stringify({
            type: "active-sessions",
            sessions: { claude: activeSessions },
          })
        );
      }
    } catch (error) {
      console.error("❌ Chat WebSocket error:", error.message);
      ws.send(
        JSON.stringify({
          type: "error",
          error: error.message,
        })
      );
    }
  });

  ws.on("close", () => {
    console.log("🔌 Chat client disconnected");
    clearInterval(heartbeatInterval);
    connectedClients.delete(ws);
  });

  ws.on("error", (error) => {
    console.error("❌ Chat WebSocket error:", error.message);
  });
}
