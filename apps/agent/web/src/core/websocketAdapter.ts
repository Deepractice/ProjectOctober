/**
 * WebSocket to EventBus Adapter
 * Converts WebSocket messages to EventBus events
 */

import { eventBus } from "./eventBus";
import type { WebSocketMessage } from "~/types";

// Track which sessions are currently streaming
// Format: sessionId -> timestamp when streaming completed
const streamingCompletedMap = new Map<string, number>();

/**
 * Adapt WebSocket message to EventBus event
 */
export function adaptWebSocketToEventBus(wsMessage: WebSocketMessage): void {
  console.log("[WebSocketAdapter] Received message:", {
    type: wsMessage.type,
    sessionId: wsMessage.sessionId,
    dataPreview:
      "data" in wsMessage
        ? typeof wsMessage.data === "object"
          ? JSON.stringify(wsMessage.data).substring(0, 100)
          : String(wsMessage.data).substring(0, 100)
        : "no data",
  });

  try {
    switch (wsMessage.type) {
      case "sdk-event":
        // ✅ NEW: Handle SDK raw events
        handleSDKEvent(wsMessage);
        break;

      case "session-created":
        eventBus.emit({
          type: "session.created",
          sessionId: wsMessage.sessionId || "",
          messages: [], // WebSocket message doesn't contain messages, they'll be loaded separately
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
        // Handle streaming stop - mark that this session had streaming
        else if (messageData?.type === "content_block_stop") {
          eventBus.emit({
            type: "message.complete",
            sessionId: wsMessage.sessionId || "",
          });
          // Mark that this session just finished streaming
          // We'll skip the next complete assistant message for this session
          if (wsMessage.sessionId) {
            streamingCompletedMap.set(wsMessage.sessionId, Date.now());
          }
        }
        // NEW: Handle tool use message (from SDK transform)
        else if (messageData?.isToolUse && messageData.toolName) {
          eventBus.emit({
            type: "message.tool",
            sessionId: wsMessage.sessionId || "",
            toolName: messageData.toolName,
            toolInput: messageData.toolInput || "",
            toolId: messageData.toolId || "",
          });
        }
        // Handle content array
        else if (Array.isArray(messageData?.content)) {
          // FIX: Check if we just finished streaming to avoid duplicates
          const sessionId = wsMessage.sessionId || "";
          const streamingCompleted = streamingCompletedMap.get(sessionId);
          let skipTextBlocks = false;

          if (streamingCompleted) {
            const timeSinceStreaming = Date.now() - streamingCompleted;
            if (timeSinceStreaming < 5000) {
              skipTextBlocks = true;
              console.log(
                "[WebSocketAdapter] Skipping text blocks in content array (already streamed)"
              );
              // Clean up on first use to avoid checking stale timestamps
              streamingCompletedMap.delete(sessionId);
            } else {
              // Clean up stale marker
              streamingCompletedMap.delete(sessionId);
            }
          }

          for (const part of messageData.content) {
            if (part.type === "tool_use") {
              eventBus.emit({
                type: "message.tool",
                sessionId: wsMessage.sessionId || "",
                toolName: part.name,
                toolInput: part.input ? JSON.stringify(part.input, null, 2) : "",
                toolId: part.id,
              });
            } else if (part.type === "text" && part.text?.trim() && !skipTextBlocks) {
              eventBus.emit({
                type: "message.assistant",
                sessionId: wsMessage.sessionId || "",
                content: part.text,
              });
            }
          }
        }
        // Handle string content - check message type
        else if (typeof messageData?.content === "string" && messageData.content.trim()) {
          // ✅ FIX: Check the actual message type instead of assuming it's assistant
          if (messageData.type === "user") {
            eventBus.emit({
              type: "message.user",
              sessionId: wsMessage.sessionId || "",
              content: messageData.content,
            });
          } else {
            // FIX: Skip complete assistant messages if we just finished streaming
            // This prevents duplicate display of streaming content
            const sessionId = wsMessage.sessionId || "";
            const streamingCompleted = streamingCompletedMap.get(sessionId);

            if (streamingCompleted) {
              // Check if streaming completed within last 5 seconds
              const timeSinceStreaming = Date.now() - streamingCompleted;
              if (timeSinceStreaming < 5000) {
                console.log(
                  "[WebSocketAdapter] Skipping duplicate assistant message (already streamed):",
                  messageData.content.substring(0, 50)
                );
                // Clean up the marker
                streamingCompletedMap.delete(sessionId);
                return;
              }
              // Clean up stale marker
              streamingCompletedMap.delete(sessionId);
            }

            // Default to assistant for backward compatibility
            eventBus.emit({
              type: "message.assistant",
              sessionId: wsMessage.sessionId || "",
              content: messageData.content,
            });
          }
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

/**
 * Handle SDK raw events from Claude SDK
 * Events: stream_event, assistant, user, result, system
 */
function handleSDKEvent(wsMessage: WebSocketMessage): void {
  if (!("data" in wsMessage) || !wsMessage.data) {
    console.warn("[WebSocketAdapter] SDK event missing data");
    return;
  }

  const sdkMessage = wsMessage.data as any;
  const sessionId = wsMessage.sessionId || "";

  console.log("[WebSocketAdapter] Processing SDK event:", {
    sessionId,
    sdkType: sdkMessage.type,
    eventType: sdkMessage.type === "stream_event" ? sdkMessage.event?.type : undefined,
  });

  switch (sdkMessage.type) {
    case "stream_event":
      handleStreamEvent(sessionId, sdkMessage.event);
      break;

    case "assistant":
      handleAssistantMessage(sessionId, sdkMessage.message);
      break;

    case "user":
      handleUserMessage(sessionId, sdkMessage.message);
      break;

    case "result":
      // Token usage updates can be handled here if needed
      console.log("[WebSocketAdapter] Received result message (token usage)");
      break;

    default:
      console.log("[WebSocketAdapter] Unhandled SDK message type:", sdkMessage.type);
  }
}

/**
 * Handle stream events (real-time streaming)
 * Event types: message_start, content_block_start, content_block_delta, content_block_stop, message_stop
 */
function handleStreamEvent(sessionId: string, event: any): void {
  console.log("[WebSocketAdapter] Stream event:", event.type);

  switch (event.type) {
    case "message_start":
      // Start of assistant response
      eventBus.emit({
        type: "agent.processing",
        sessionId,
        status: "Generating response",
      });
      break;

    case "content_block_start":
      // Start of a content block (text or tool_use)
      if (event.content_block?.type === "text") {
        // Start streaming text
        eventBus.emit({
          type: "agent.processing",
          sessionId,
          status: "Generating response",
        });
      } else if (event.content_block?.type === "tool_use") {
        // Tool use started - just update status, don't create message yet
        // The complete tool_use message will come in the assistant message
        eventBus.emit({
          type: "agent.processing",
          sessionId,
          status: `Using ${event.content_block.name} tool`,
        });
      }
      break;

    case "content_block_delta":
      // Streaming text delta
      if (event.delta?.type === "text_delta" && event.delta.text) {
        eventBus.emit({
          type: "message.streaming",
          sessionId,
          chunk: event.delta.text,
        });
      } else if (event.delta?.type === "input_json_delta") {
        // Tool input is being streamed (we can ignore this or accumulate)
        console.log("[WebSocketAdapter] Tool input delta (ignored)");
      }
      break;

    case "content_block_stop":
      // End of content block
      eventBus.emit({
        type: "message.complete",
        sessionId,
      });
      break;

    case "message_stop":
      // End of entire message
      console.log("[WebSocketAdapter] Message stop");
      break;

    default:
      console.log("[WebSocketAdapter] Unhandled stream event:", event.type);
  }
}

/**
 * Handle complete assistant messages
 * Contains full content blocks (text, tool_use)
 */
function handleAssistantMessage(sessionId: string, message: any): void {
  if (!Array.isArray(message.content)) {
    console.warn("[WebSocketAdapter] Assistant message has no content array");
    return;
  }

  console.log("[WebSocketAdapter] Assistant message with", message.content.length, "blocks");

  for (const block of message.content) {
    if (block.type === "text" && block.text) {
      // Complete text block (not from streaming)
      // This might be duplicate if we already streamed it
      // We can check if we just finished streaming and skip
      console.log("[WebSocketAdapter] Assistant text block (may be duplicate from streaming)");
      // Uncomment if needed:
      // eventBus.emit({
      //   type: "message.assistant",
      //   sessionId,
      //   content: block.text,
      // });
    } else if (block.type === "tool_use") {
      // Tool use block - emit if not already emitted via stream_event
      console.log("[WebSocketAdapter] Tool use block:", block.name);
      eventBus.emit({
        type: "message.tool",
        sessionId,
        toolName: block.name,
        toolInput: block.input ? JSON.stringify(block.input, null, 2) : "",
        toolId: block.id,
      });
    }
  }
}

/**
 * Handle user messages (contains tool_result blocks)
 */
function handleUserMessage(sessionId: string, message: any): void {
  if (!Array.isArray(message.content)) {
    console.warn("[WebSocketAdapter] User message has no content array");
    return;
  }

  console.log("[WebSocketAdapter] User message with", message.content.length, "blocks");

  for (const block of message.content) {
    if (block.type === "tool_result") {
      // ✅ FIX: This is where tool results are properly handled!
      console.log("[WebSocketAdapter] Tool result for:", block.tool_use_id);
      eventBus.emit({
        type: "message.toolResult",
        sessionId,
        toolId: block.tool_use_id,
        result: {
          content: block.content,
          isError: block.is_error || false,
          timestamp: new Date(),
        },
      });
    } else if (block.type === "text" && block.text) {
      // Regular user text (shouldn't happen via SDK, but handle it)
      console.log("[WebSocketAdapter] User text block");
      eventBus.emit({
        type: "message.user",
        sessionId,
        content: block.text,
      });
    }
  }
}
