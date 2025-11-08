# Event-Driven API Guide

## Overview

Agent SDK provides a powerful event-driven architecture built on:

- **XState**: State machines for predictable state management
- **EventEmitter3**: Type-safe event emission
- **Dual State Machines**:
  - **Agent State**: What the AI is doing (idle, thinking, speaking, tool_calling, etc.)
  - **Session State**: Container lifecycle (created, active, idle, completed, etc.)

## Quick Start

```typescript
import { createAgent } from "@deepractice-ai/agent-sdk";

const agent = createAgent({
  workspace: "./project",
  model: "claude-sonnet-4",
});

await agent.initialize();

const session = await agent.createSession();

// Listen to events
session.on("agent:thinking", () => {
  console.log("🤔 AI is thinking...");
});

session.on("agent:speaking", ({ chunk }) => {
  console.log("💬", chunk);
});

session.on("stream:end", () => {
  console.log("✅ Done!");
});

// Send message
await session.send("Hello!");
```

---

## Event Categories

### 1. Agent State Events

Track what the AI is currently doing:

```typescript
// AI is idle, waiting for input
session.on("agent:idle", ({ timestamp }) => {
  updateUI("idle");
});

// AI received message and is thinking
session.on("agent:thinking", ({ timestamp }) => {
  showSpinner();
});

// AI is generating response
session.on("agent:speaking", ({ message, chunk }) => {
  appendText(chunk);
});

// AI is calling a tool
session.on("agent:tool_calling", ({ toolName, toolId, input }) => {
  showToolIndicator(toolName);
});

// AI is waiting for tool result
session.on("agent:tool_waiting", ({ toolId }) => {
  showWaitingState();
});

// AI encountered an error
session.on("agent:error", ({ error }) => {
  showError(error.message);
});

// Conversation completed
session.on("agent:completed", ({ timestamp }) => {
  hideSpinner();
});
```

### 2. Message Events

Track messages in the conversation:

```typescript
// User sent a message
session.on("message:user", ({ message }) => {
  displayMessage(message, "user");
});

// Agent sent a message
session.on("message:agent", ({ message }) => {
  displayMessage(message, "agent");
});

// Tool message (tool call or result)
session.on("message:tool", ({ message }) => {
  displayToolMessage(message);
});
```

### 3. Stream Events

Track streaming progress:

```typescript
// Stream started
session.on("stream:start", ({ timestamp }) => {
  startTimer();
});

// Received a chunk
session.on("stream:chunk", ({ chunk, index }) => {
  appendChunk(chunk);
  updateProgress(index);
});

// Stream ended
session.on("stream:end", ({ timestamp, totalChunks }) => {
  stopTimer();
  console.log(`Received ${totalChunks} chunks`);
});
```

### 4. Session Lifecycle Events

Track session container state:

```typescript
// Session created
session.on("session:created", ({ sessionId, timestamp }) => {
  addToSessionList(sessionId);
});

// Session is active (in use)
session.on("session:active", ({ sessionId, timestamp }) => {
  markAsActive(sessionId);
});

// Session is idle (paused)
session.on("session:idle", ({ sessionId, timestamp }) => {
  markAsIdle(sessionId);
});

// Session completed
session.on("session:completed", ({ sessionId, timestamp }) => {
  markAsCompleted(sessionId);
});

// Session error
session.on("session:error", ({ sessionId, error, timestamp }) => {
  showSessionError(sessionId, error);
});

// Session deleted
session.on("session:deleted", ({ sessionId, timestamp }) => {
  removeFromList(sessionId);
});
```

### 5. Persistence Events

Monitor data persistence:

```typescript
// Message persistence started
session.on("persist:message:start", ({ messageId, sessionId }) => {
  showSavingIndicator(messageId);
});

// Message saved successfully
session.on("persist:message:success", ({ messageId, sessionId }) => {
  hideSavingIndicator(messageId);
});

// Message persistence failed
session.on("persist:message:error", ({ messageId, sessionId, error }) => {
  showRetryButton(messageId);
  console.error("Failed to save message:", error);
});

// Session metadata persistence
session.on("persist:session:start", ({ sessionId }) => {});
session.on("persist:session:success", ({ sessionId }) => {});
session.on("persist:session:error", ({ sessionId, error }) => {});
```

---

## Agent-Level Events

Listen to events from all sessions:

```typescript
// Agent initialized
agent.on("agent:initialized", ({ sessionCount, timestamp }) => {
  console.log(`Agent ready with ${sessionCount} sessions`);
});

// Agent destroyed
agent.on("agent:destroyed", ({ timestamp }) => {
  cleanup();
});

// All session events are also emitted at agent level
agent.on("agent:speaking", ({ message, chunk }) => {
  // This fires for ANY session
  broadcastToAllClients(chunk);
});
```

---

## Real-World Examples

### Example 1: Real-Time Chat UI

```typescript
const session = await agent.createSession();

// Show typing indicator
session.on("agent:thinking", () => {
  typingIndicator.show();
});

session.on("agent:speaking", ({ chunk }) => {
  typingIndicator.hide();
  messageContainer.append(chunk);
});

session.on("stream:end", () => {
  scrollToBottom();
  enableInput();
});

session.on("agent:error", ({ error }) => {
  showErrorToast(error.message);
  enableRetry();
});

await session.send(userInput);
```

### Example 2: Progress Tracking

```typescript
let chunkCount = 0;
let startTime: number;

session.on("stream:start", () => {
  chunkCount = 0;
  startTime = Date.now();
  progressBar.show();
});

session.on("stream:chunk", ({ chunk, index }) => {
  chunkCount++;
  progressBar.setValue(index);
});

session.on("stream:end", ({ totalChunks }) => {
  const duration = Date.now() - startTime;
  console.log(`Received ${totalChunks} chunks in ${duration}ms`);
  progressBar.complete();
});
```

### Example 3: Tool Call Visualization

```typescript
session.on("agent:tool_calling", ({ toolName, toolId, input }) => {
  toolPanel.show();
  toolPanel.addToolCall({
    id: toolId,
    name: toolName,
    input: input,
    status: "calling",
  });
});

session.on("agent:tool_waiting", ({ toolId }) => {
  toolPanel.updateStatus(toolId, "waiting");
});

session.on("agent:thinking", () => {
  // After tool result, AI continues thinking
  toolPanel.updateStatus(toolId, "complete");
});
```

### Example 4: Persistence Monitoring

```typescript
const pendingMessages = new Set<string>();

session.on("persist:message:start", ({ messageId }) => {
  pendingMessages.add(messageId);
  updateSyncStatus();
});

session.on("persist:message:success", ({ messageId }) => {
  pendingMessages.delete(messageId);
  updateSyncStatus();
});

session.on("persist:message:error", ({ messageId, error }) => {
  console.error(`Failed to save ${messageId}:`, error);
  showRetryOption(messageId);
});

function updateSyncStatus() {
  if (pendingMessages.size === 0) {
    syncIndicator.show("✅ All saved");
  } else {
    syncIndicator.show(`⏳ Saving ${pendingMessages.size}...`);
  }
}
```

### Example 5: Analytics & Monitoring

```typescript
// Track all events for analytics
agent.onAny((eventName, data) => {
  analytics.track(eventName, {
    ...data,
    timestamp: new Date().toISOString(),
  });
});

// Measure AI response time
let messageStartTime: number;

session.on("message:user", () => {
  messageStartTime = Date.now();
});

session.on("stream:end", () => {
  const responseTime = Date.now() - messageStartTime;
  analytics.track("ai_response_time", { duration: responseTime });
});

// Track tool usage
session.on("agent:tool_calling", ({ toolName }) => {
  analytics.track("tool_used", { toolName });
});
```

---

## Backward Compatibility

The Observable API is still available:

```typescript
// Observable API (RxJS)
session.messages$().subscribe((message) => {
  console.log("New message:", message);
});

// Event API (EventEmitter)
session.on("message:agent", ({ message }) => {
  console.log("New message:", message);
});
```

Both APIs work simultaneously. Use whichever fits your needs:

- **EventEmitter**: Simpler, more familiar, better for most cases
- **Observable**: Powerful operators, better for complex reactive flows

---

## TypeScript Support

All events are fully typed:

```typescript
import type { SessionEvents, AgentLevelEvents } from "@deepractice-ai/agent-sdk";

// Type-safe event listeners
session.on("agent:speaking", ({ message, chunk }) => {
  // message and chunk are properly typed
  const text: string = chunk!;
});

// Type-safe event names
type EventName = keyof SessionEvents;
const eventName: EventName = "agent:thinking"; // ✅
const invalid: EventName = "invalid:event"; // ❌ TypeScript error
```

---

## Best Practices

### 1. Clean Up Event Listeners

```typescript
// Store listener reference
const speakingHandler = ({ chunk }: any) => {
  console.log(chunk);
};

session.on("agent:speaking", speakingHandler);

// Clean up when done
session.off("agent:speaking", speakingHandler);
```

### 2. Use Once for One-Time Events

```typescript
// Only listen once
session.once("stream:end", () => {
  console.log("Stream ended");
});
```

### 3. Listen to Agent for Global Events

```typescript
// Listen at agent level for all sessions
agent.on("agent:error", ({ error }) => {
  // Centralized error handling
  errorService.report(error);
});
```

### 4. Combine with State Machines

```typescript
// The state machines are internal, but you can use events
// to build your own state tracking

let agentState = "idle";

session.on("agent:idle", () => {
  agentState = "idle";
});
session.on("agent:thinking", () => {
  agentState = "thinking";
});
session.on("agent:speaking", () => {
  agentState = "speaking";
});

console.log("Current AI state:", agentState);
```

---

## Debugging

```typescript
// Log all events
session.onAny((event, data) => {
  console.log(`[${new Date().toISOString()}] ${event}`, data);
});

// Or use a logger
import { createLogger } from "@deepracticex/logger";

const logger = createLogger("session-events");

session.onAny((event, data) => {
  logger.debug({ event, data }, "Session event");
});
```

---

## Next Steps

- [Architecture Documentation](./architecture.md)
- [State Machine Details](./state-machines.md)
- [API Reference](./api-reference.md)
