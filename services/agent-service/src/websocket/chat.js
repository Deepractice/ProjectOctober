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

        console.log("🔵 [WebSocket] Received agent-command:", {
          sessionId,
          commandPreview: data.command.substring(0, 50) + "...",
          hasSessionId: !!sessionId,
        });

        try {
          let session;
          let isNewSession = false;

          if (sessionId) {
            // Resume existing session
            console.log("🔵 [WebSocket] Resuming existing session:", sessionId);
            session = agent.getSession(sessionId);
            if (!session) {
              throw new Error(`Session ${sessionId} not found`);
            }
            console.log(
              "🔵 [WebSocket] Session found, current messages:",
              session.getMessages().length
            );
          } else {
            // Create new session (from warmup pool)
            console.log("🔵 [WebSocket] Creating new session");
            session = await agent.createSession({
              model: data.options?.model,
            });
            isNewSession = true;

            console.log("🔵 [WebSocket] New session created:", session.id);

            // Send session-created event
            ws.send(
              JSON.stringify({
                type: "session-created",
                sessionId: session.id,
              })
            );
          }

          // Track messages we've already sent to avoid duplicates
          const messagesBefore = session.getMessages().length;

          // Subscribe to NEW messages only (skip existing messages)
          console.log("🔵 [WebSocket] Subscribing to session messages stream");
          const subscription = session.messages$().subscribe({
            next: (msg) => {
              // For existing sessions, skip messages that were already there
              const currentMessages = session.getMessages();
              const msgIndex = currentMessages.findIndex((m) => m.id === msg.id);

              if (!isNewSession && msgIndex < messagesBefore) {
                // This is an old message, skip it
                console.log("🔵 [WebSocket] Skipping old message:", msg.id);
                return;
              }

              console.log("🔵 [WebSocket] Received NEW message from stream:", {
                sessionId: session.id,
                messageType: msg.type,
                messageId: msg.id,
                contentPreview: msg.content?.substring(0, 50) + "...",
              });

              ws.send(
                JSON.stringify({
                  type: "agent-response",
                  sessionId: session.id,
                  data: msg,
                })
              );
            },
            error: (err) => {
              console.error("🔵 [WebSocket] Stream error:", err);
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
          console.log("🔵 [WebSocket] Calling session.send()...");
          await session.send(data.command);
          const messagesAfter = session.getMessages().length;

          console.log("🔵 [WebSocket] session.send() completed:", {
            sessionId: session.id,
            messagesBefore,
            messagesAfter,
            messagesAdded: messagesAfter - messagesBefore,
          });

          // Unsubscribe to prevent duplicate subscriptions
          subscription.unsubscribe();
          console.log("🔵 [WebSocket] Unsubscribed from message stream");

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
