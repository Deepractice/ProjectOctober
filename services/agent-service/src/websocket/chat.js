/**
 * Chat WebSocket Handler - Using Agent SDK
 */
import { getAgent } from "../agent.js";

export function handleChatConnection(ws, connectedClients) {
  console.log("💬 Chat WebSocket connected");
  connectedClients.add(ws);

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "agent-command") {
        const sessionId = data.options?.sessionId;
        const agent = await getAgent();

        try {
          let session;

          if (sessionId) {
            // Resume existing session
            session = agent.getSession(sessionId);
            if (!session) {
              throw new Error(`Session ${sessionId} not found`);
            }
          } else {
            // Create new session (from warmup pool)
            session = await agent.createSession({
              model: data.options?.model,
            });

            // Send session-created event
            ws.send(
              JSON.stringify({
                type: "session-created",
                sessionId: session.id,
              })
            );
          }

          // Subscribe to messages
          const subscription = session.messages$().subscribe({
            next: (msg) => {
              ws.send(
                JSON.stringify({
                  type: "agent-response",
                  sessionId: session.id,
                  data: msg,
                })
              );
            },
            error: (err) => {
              ws.send(
                JSON.stringify({
                  type: "claude-error",
                  sessionId: session.id,
                  error: err.message,
                })
              );
              subscription.unsubscribe();
            },
          });

          // Send message
          await session.send(data.command);

          // After send completes, notify frontend
          ws.send(
            JSON.stringify({
              type: "agent-complete",
              sessionId: session.id,
              exitCode: 0,
            })
          );
        } catch (error) {
          ws.send(
            JSON.stringify({
              type: "claude-error",
              error: error.message,
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
    connectedClients.delete(ws);
  });
}
