# WebSocket Bridge Usage Example

## Overview

The WebSocket Bridge automatically converts Session EventEmitter events to WebSocket messages, eliminating the need for manual event forwarding.

## Server-Side (Node.js)

### Before (Manual Forwarding)

```javascript
// Old approach: manually subscribe and forward each event
session.messages$().subscribe((msg) => {
  ws.send(
    JSON.stringify({
      type: "agent-response",
      sessionId: session.id,
      data: msg,
    })
  );
});

session.on("agent:speaking", ({ chunk }) => {
  ws.send(
    JSON.stringify({
      type: "chunk",
      data: chunk,
    })
  );
});

// ... repeat for every event type
```

### After (Automatic with WebSocket Bridge)

```javascript
import { WebSocketBridge } from "@deepractice-ai/agent-sdk";

// Create bridge - automatically forwards ALL events
const bridge = new WebSocketBridge(session, ws);

// That's it! All session events are automatically sent to the client
// Clean up on disconnect
ws.on("close", () => {
  bridge.destroy();
});
```

## Client-Side (Browser)

### Option 1: Use BrowserSession (Recommended)

```typescript
import { createBrowserSession } from "@deepractice-ai/agent-sdk/browser";

// Create browser session
const session = createBrowserSession(sessionId, "ws://localhost:5200/ws");

// Use exactly like Node.js Session
session.on("agent:speaking", ({ chunk }) => {
  console.log(chunk);
  updateUI(chunk);
});

session.on("stream:end", () => {
  console.log("Done!");
});

// Send message
await session.send("Hello!");
```

### Option 2: Manual WebSocket Handling

```javascript
const ws = new WebSocket("ws://localhost:5200/ws");

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.type === "event") {
    // Handle session events
    const { eventName, eventData } = message;

    switch (eventName) {
      case "agent:speaking":
        console.log(eventData.chunk);
        break;
      case "stream:end":
        console.log("Done!");
        break;
    }
  }
};

// Send message
ws.send(
  JSON.stringify({
    type: "session:send",
    sessionId: "session-id",
    content: "Hello!",
  })
);
```

## Complete Server Example

```javascript
import { createAgent, WebSocketBridge } from "@deepractice-ai/agent-sdk";
import { WebSocketServer } from "ws";

const agent = await createAgent({ workspace: "./project" });
const wss = new WebSocketServer({ port: 5200 });

wss.on("connection", async (ws, request) => {
  // Extract session ID from URL
  const url = new URL(request.url, "http://localhost");
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    ws.close(1008, "Missing sessionId");
    return;
  }

  // Get or create session
  let session = agent.getSession(sessionId);
  if (!session) {
    session = await agent.createSession({ id: sessionId });
  }

  // Create bridge - automatically forwards all events
  const bridge = new WebSocketBridge(session, ws);

  // Clean up on disconnect
  ws.on("close", () => {
    console.log("Client disconnected");
    bridge.destroy();
  });

  console.log("Client connected to session:", sessionId);
});
```

## Complete Browser Example

```typescript
import { createBrowserSession } from "@deepractice-ai/agent-sdk/browser";

async function main() {
  // Get session ID from server
  const response = await fetch("/api/sessions/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Hello!" }),
  });

  const { sessionId } = await response.json();

  // Create browser session
  const session = createBrowserSession(sessionId, `ws://localhost:5200/ws?sessionId=${sessionId}`);

  // Listen to events
  session.on("agent:thinking", () => {
    console.log("AI is thinking...");
  });

  session.on("agent:speaking", ({ chunk }) => {
    document.getElementById("output").textContent += chunk;
  });

  session.on("stream:end", () => {
    console.log("Response complete!");
  });

  // Send message (already sent in creation, but you can send more)
  await session.send("Tell me more");
}

main();
```

## WebSocket Protocol

### Client → Server Messages

```typescript
// Send message
{
  type: "session:send",
  sessionId: "session-id",
  content: "Hello!" // or ContentBlock[]
}

// Abort session
{
  type: "session:abort",
  sessionId: "session-id"
}

// Complete session
{
  type: "session:complete",
  sessionId: "session-id"
}

// Delete session
{
  type: "session:delete",
  sessionId: "session-id"
}
```

### Server → Client Messages

```typescript
// Event notification
{
  type: "event",
  sessionId: "session-id",
  eventName: "agent:speaking",
  eventData: {
    message: { /* AnyMessage */ },
    chunk: "Hello"
  },
  timestamp: "2025-11-08T12:00:00.000Z"
}

// Error
{
  type: "error",
  sessionId: "session-id",
  error: {
    message: "Something went wrong",
    stack: "..."
  },
  timestamp: "2025-11-08T12:00:00.000Z"
}
```

## Event Types

All Session EventEmitter events are automatically forwarded:

- **Agent State**: `agent:idle`, `agent:thinking`, `agent:speaking`, `agent:tool_calling`, `agent:tool_waiting`, `agent:error`, `agent:completed`
- **Messages**: `message:user`, `message:agent`, `message:tool`
- **Streaming**: `stream:start`, `stream:chunk`, `stream:end`
- **Session Lifecycle**: `session:created`, `session:active`, `session:idle`, `session:completed`, `session:error`, `session:deleted`
- **Persistence**: `persist:message:start`, `persist:message:success`, `persist:message:error`, etc.

## Benefits

1. **✅ Automatic Event Forwarding**: No need to manually subscribe to each event
2. **✅ Type-Safe**: Full TypeScript support on both sides
3. **✅ Same API**: Browser code uses the same Session interface as Node.js
4. **✅ Less Code**: Dramatically simplifies server-side WebSocket handling
5. **✅ Error Handling**: Automatic error message formatting
6. **✅ Clean Up**: Proper resource cleanup with `bridge.destroy()`

## Migration Guide

### Update Server

```diff
- // Manual event forwarding
- session.messages$().subscribe((msg) => {
-   ws.send(JSON.stringify({ type: "agent-response", data: msg }));
- });

+ // Automatic bridge
+ import { WebSocketBridge } from "@deepractice-ai/agent-sdk";
+ const bridge = new WebSocketBridge(session, ws);
+ ws.on("close", () => bridge.destroy());
```

### Update Client

```diff
- // Manual WebSocket handling
- ws.onmessage = (event) => {
-   const data = JSON.parse(event.data);
-   if (data.type === "agent-response") {
-     handleMessage(data.data);
-   }
- };

+ // Use BrowserSession
+ import { createBrowserSession } from "@deepractice-ai/agent-sdk/browser";
+ const session = createBrowserSession(sessionId, wsUrl);
+ session.on("message:agent", ({ message }) => {
+   handleMessage(message);
+ });
```
