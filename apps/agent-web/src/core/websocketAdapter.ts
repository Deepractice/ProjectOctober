/**
 * WebSocket to EventBus Adapter
 * Converts WebSocket messages to EventBus events
 */

import { eventBus } from "./eventBus";
import type { WebSocketMessage } from "~/types";

/**
 * Adapt WebSocket message to EventBus event
 */
export function adaptWebSocketToEventBus(wsMessage: WebSocketMessage): void {
  try {
    switch (wsMessage.type) {
      case "session-created":
        eventBus.emit({
          type: "session.created",
          sessionId: wsMessage.sessionId || "",
        });
        break;

      case "sessions_updated":
        eventBus.emit({
          type: "session.updated",
          sessions: "sessions" in wsMessage ? wsMessage.sessions || [] : [],
        });
        break;

      case "agent-response": {
        const messageData =
          "data" in wsMessage && wsMessage.data
            ? typeof wsMessage.data === "object" && "message" in wsMessage.data
              ? wsMessage.data.message
              : wsMessage.data
            : null;

        // Handle streaming start - emit agent.processing
        if (messageData?.type === "content_block_start") {
          eventBus.emit({
            type: "agent.processing",
            sessionId: wsMessage.sessionId || "",
            status: "Generating response",
          });
        }
        // Handle streaming delta
        else if (messageData?.type === "content_block_delta" && messageData.delta?.text) {
          eventBus.emit({
            type: "message.streaming",
            sessionId: wsMessage.sessionId || "",
            chunk: messageData.delta.text,
          });
        }
        // Handle streaming stop
        else if (messageData?.type === "content_block_stop") {
          eventBus.emit({
            type: "message.complete",
            sessionId: wsMessage.sessionId || "",
          });
        }
        // Handle content array
        else if (Array.isArray(messageData?.content)) {
          for (const part of messageData.content) {
            if (part.type === "tool_use") {
              eventBus.emit({
                type: "message.tool",
                sessionId: wsMessage.sessionId || "",
                toolName: part.name,
                toolInput: part.input ? JSON.stringify(part.input, null, 2) : "",
                toolId: part.id,
              });
            } else if (part.type === "text" && part.text?.trim()) {
              eventBus.emit({
                type: "message.assistant",
                sessionId: wsMessage.sessionId || "",
                content: part.text,
              });
            }
          }
        }
        // Handle string content
        else if (typeof messageData?.content === "string" && messageData.content.trim()) {
          eventBus.emit({
            type: "message.assistant",
            sessionId: wsMessage.sessionId || "",
            content: messageData.content,
          });
        }

        // Handle tool results
        if (messageData?.role === "user" && Array.isArray(messageData.content)) {
          for (const part of messageData.content) {
            if (part.type === "tool_result") {
              eventBus.emit({
                type: "message.toolResult",
                sessionId: wsMessage.sessionId || "",
                toolId: part.tool_use_id,
                result: {
                  content: part.content,
                  isError: part.is_error,
                  timestamp: new Date(),
                },
              });
            }
          }
        }
        break;
      }

      case "claude-output":
        if ("data" in wsMessage && wsMessage.data && typeof wsMessage.data === "string") {
          eventBus.emit({
            type: "message.streaming",
            sessionId: wsMessage.sessionId || "",
            chunk: wsMessage.data,
          });
        }
        break;

      case "claude-error":
        // Emit agent error event
        eventBus.emit({
          type: "agent.error",
          sessionId: wsMessage.sessionId || "",
          error: new Error(("error" in wsMessage && wsMessage.error) || "Unknown error"),
        });
        eventBus.emit({
          type: "message.error",
          sessionId: wsMessage.sessionId || "",
          error: new Error(("error" in wsMessage && wsMessage.error) || "Unknown error"),
        });
        break;

      case "agent-complete":
        // Emit agent complete event
        eventBus.emit({
          type: "agent.complete",
          sessionId: wsMessage.sessionId || "",
        });
        eventBus.emit({
          type: "session.processing",
          sessionId: wsMessage.sessionId || "",
          isProcessing: false,
        });
        break;

      case "session-aborted":
        eventBus.emit({
          type: "session.aborted",
          sessionId: wsMessage.sessionId || "",
        });
        eventBus.emit({
          type: "session.processing",
          sessionId: wsMessage.sessionId || "",
          isProcessing: false,
        });
        break;

      case "session-status":
        eventBus.emit({
          type: "session.processing",
          sessionId: wsMessage.sessionId || "",
          isProcessing: ("isProcessing" in wsMessage && wsMessage.isProcessing) || false,
        });
        break;

      case "claude-status": {
        const statusData = "data" in wsMessage ? wsMessage.data : null;
        if (statusData) {
          let statusText = "Working...";
          let tokens = 0;

          if (typeof statusData === "object" && statusData !== null) {
            if ("message" in statusData && typeof statusData.message === "string") {
              statusText = statusData.message;
            } else if ("status" in statusData && typeof statusData.status === "string") {
              statusText = statusData.status;
            }

            if ("tokens" in statusData && typeof statusData.tokens === "number") {
              tokens = statusData.tokens;
            } else if ("token_count" in statusData && typeof statusData.token_count === "number") {
              tokens = statusData.token_count;
            }
          } else if (typeof statusData === "string") {
            statusText = statusData;
          }

          // Emit agent processing event (replaces ui.thinking)
          eventBus.emit({
            type: "agent.processing",
            sessionId: wsMessage.sessionId || "",
            status: statusText,
            tokens,
          });
        }
        break;
      }

      default:
        console.warn("[WebSocketAdapter] Unhandled message type:", wsMessage.type);
    }
  } catch (error) {
    console.error("[WebSocketAdapter] Error processing message:", error);
    eventBus.emit({
      type: "error.unknown",
      error: error as Error,
    });
  }
}
