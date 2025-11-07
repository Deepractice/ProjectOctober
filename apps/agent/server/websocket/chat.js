/**
 * Chat WebSocket Handler - Using Agent SDK
 *
 * Handles WebSocket connections for chat functionality.
 * Supports multi-modal messages (text + images) and agent commands.
 *
 * @typedef {import('@deepractice-ai/agent-types').AgentCommandMessage} AgentCommandMessage
 * @typedef {import('@deepractice-ai/agent-types').AbortSessionMessage} AbortSessionMessage
 * @typedef {import('@deepractice-ai/agent-types').AgentResponseMessage} AgentResponseMessage
 * @typedef {import('@deepractice-ai/agent-types').AgentCompleteMessage} AgentCompleteMessage
 * @typedef {import('@deepractice-ai/agent-types').ClaudeErrorMessage} ClaudeErrorMessage
 * @typedef {import('@deepractice-ai/agent-types').AgentMessage} AgentMessage
 * @typedef {import('@deepractice-ai/agent-types').ContentBlock} ContentBlock
 */
import { getAgent } from "../agent.js";

/**
 * Handle chat WebSocket connection
 *
 * @param {import('ws').WebSocket} ws - WebSocket connection
 * @param {Set<import('ws').WebSocket>} connectedClients - Set of connected clients
 */
export function handleChatConnection(ws, connectedClients) {
  console.log("💬 Chat WebSocket connected");
  connectedClients.add(ws);

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === "agent-command") {
        const sessionId = data.options?.sessionId;
        const images = data.options?.images;
        const agent = await getAgent();

        console.log("🔵 [WebSocket] Received agent-command:", {
          sessionId,
          commandPreview: data.command.substring(0, 50) + "...",
          hasSessionId: !!sessionId,
          hasImages: !!images,
          imageCount: images?.length || 0,
        });

        // 🖼️ IMAGE TRACKING: Log image data received from frontend
        if (images && images.length > 0) {
          console.log("🖼️ [IMAGE-TRACK] Images received from frontend:", {
            sessionId,
            imageCount: images.length,
            images: images.map((img) => ({
              type: img.type,
              dataLength: img.data?.length || 0,
              dataPreview: img.data ? img.data.substring(0, 50) + "..." : "no data",
            })),
          });
        }

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
          console.log(
            "🔵 [WebSocket] Session found, current messages:",
            session.getMessages().length
          );

          const isNewSession = false;

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

              const contentPreview =
                typeof msg.content === "string"
                  ? msg.content.substring(0, 50)
                  : Array.isArray(msg.content)
                    ? `ContentBlock[${msg.content.length}]`
                    : String(msg.content).substring(0, 50);

              console.log("🔵 [WebSocket] Received NEW message from stream:", {
                sessionId: session.id,
                messageType: msg.type,
                messageId: msg.id,
                contentPreview: contentPreview + "...",
                contentType: typeof msg.content,
                isArray: Array.isArray(msg.content),
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

          // Construct content - support both text-only and multi-modal
          // @type {string | ContentBlock[]}
          let content = data.command;

          if (images && images.length > 0) {
            // Build ContentBlock[] format for multi-modal input
            console.log("🔵 [WebSocket] Processing images:", images.length);

            /** @type {ContentBlock[]} */
            const contentBlocks = [
              {
                type: "text",
                text: data.command,
              },
            ];

            // Add each image as an image block
            for (const img of images) {
              contentBlocks.push({
                type: "image",
                source: {
                  type: "base64",
                  media_type: img.type,
                  data: img.data,
                },
              });
            }

            content = contentBlocks;
            console.log("🔵 [WebSocket] Constructed content blocks:", {
              totalBlocks: contentBlocks.length,
              blockTypes: contentBlocks.map((b) => b.type),
            });

            // 🖼️ IMAGE TRACKING: Log ContentBlock[] details
            console.log("🖼️ [IMAGE-TRACK] ContentBlock[] constructed:", {
              sessionId,
              totalBlocks: contentBlocks.length,
              imageBlocks: contentBlocks.filter((b) => b.type === "image").length,
              blocks: contentBlocks.map((b) => ({
                type: b.type,
                hasSource: b.type === "image" && !!b.source,
                sourceType: b.type === "image" ? b.source?.type : undefined,
                mediaType: b.type === "image" ? b.source?.media_type : undefined,
                dataLength: b.type === "image" ? b.source?.data?.length : undefined,
              })),
            });
          }

          // Send message (now supports both string and ContentBlock[])
          console.log("🔵 [WebSocket] Calling session.send()...");
          await session.send(content);
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
