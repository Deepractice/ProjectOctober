# BrowserAgent Usage Guide

## Architecture Overview

```
Browser Frontend
    ↓
BrowserAgent (Single WebSocket)
    ├→ VirtualSession 1 (EventEmitter)
    ├→ VirtualSession 2 (EventEmitter)
    └→ VirtualSession 3 (EventEmitter)
    ↓
WebSocket Protocol
    ↓
Server (WebSocketBridge)
    ├→ Session 1 (Real Session)
    ├→ Session 2 (Real Session)
    └→ Session 3 (Real Session)
```

## Key Concepts

### BrowserAgent
- **Single WebSocket connection** to server
- **Multiplexes multiple sessions** over one connection
- Manages automatic reconnection
- Routes messages based on `sessionId`

### VirtualSession
- Lightweight session wrapper
- Same API as Node.js `Session`
- No own WebSocket (routes through BrowserAgent)
- Fully event-driven with EventEmitter

## Basic Usage

### 1. Initialize Agent

```typescript
import { createBrowserAgent } from "@deepractice-ai/agent-sdk/browser";

// Create agent (establishes WebSocket connection)
const agent = createBrowserAgent("ws://localhost:5200/ws");

// Initialize (connects to server)
await agent.initialize();
```

### 2. Get/Create Sessions

```typescript
// Get existing session
const session1 = agent.getSession("session-1");

// Get another session (same WebSocket!)
const session2 = agent.getSession("session-2");
```

### 3. Listen to Events

```typescript
// Session 1
session1.on("agent:thinking", () => {
  console.log("AI is thinking...");
});

session1.on("agent:speaking", ({ chunk }) => {
  console.log("Session 1:", chunk);
});

session1.on("stream:end", () => {
  console.log("Session 1 complete!");
});

// Session 2 (independent events)
session2.on("agent:speaking", ({ chunk }) => {
  console.log("Session 2:", chunk);
});
```

### 4. Send Messages

```typescript
// Send to session 1
await session1.send("Hello from session 1!");

// Send to session 2 (same time!)
await session2.send("Hello from session 2!");
```

## Complete Example

```typescript
import { createBrowserAgent } from "@deepractice-ai/agent-sdk/browser";

async function main() {
  // 1. Create and initialize agent
  const agent = createBrowserAgent("ws://localhost:5200/ws", {
    reconnect: true,
    maxReconnectAttempts: 5,
  });

  await agent.initialize();

  // 2. Listen to agent-level events
  agent.on("connected", () => {
    console.log("Agent connected!");
  });

  agent.on("disconnected", () => {
    console.log("Agent disconnected");
  });

  agent.on("reconnecting", ({ attempt, delay }) => {
    console.log(`Reconnecting... attempt ${attempt}, delay ${delay}ms`);
  });

  // 3. Get sessions (create via HTTP API first)
  const response = await fetch("/api/sessions/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "Hello!" }),
  });

  const { sessionId } = await response.json();

  // 4. Get session from agent
  const session = agent.getSession(sessionId);

  // 5. Setup event listeners
  session.on("agent:thinking", () => {
    updateUI("thinking");
  });

  session.on("agent:speaking", ({ chunk }) => {
    appendToUI(chunk);
  });

  session.on("stream:end", () => {
    updateUI("complete");
  });

  session.on("agent:error", ({ error }) => {
    showError(error.message);
  });

  // 6. Send messages
  await session.send("Tell me more!");
}

main();
```

## Multi-Session Example

```typescript
async function multiSessionExample() {
  const agent = createBrowserAgent("ws://localhost:5200/ws");
  await agent.initialize();

  // Create multiple sessions
  const sessions = [
    agent.getSession("session-1"),
    agent.getSession("session-2"),
    agent.getSession("session-3"),
  ];

  // Setup listeners for all
  sessions.forEach((session, index) => {
    session.on("agent:speaking", ({ chunk }) => {
      updateSessionUI(index, chunk);
    });
  });

  // Send to all sessions simultaneously
  await Promise.all([
    sessions[0].send("Question 1"),
    sessions[1].send("Question 2"),
    sessions[2].send("Question 3"),
  ]);

  // Only ONE WebSocket connection is used!
}
```

## Integration with Zustand

```typescript
// stores/agentStore.ts
import { create } from "zustand";
import { createBrowserAgent } from "@deepractice-ai/agent-sdk/browser";

interface AgentState {
  agent: ReturnType<typeof createBrowserAgent> | null;
  initialize: () => Promise<void>;
  getSession: (sessionId: string) => any;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agent: null,

  initialize: async () => {
    const agent = createBrowserAgent("ws://localhost:5200/ws");
    await agent.initialize();
    set({ agent });
  },

  getSession: (sessionId: string) => {
    const { agent } = get();
    if (!agent) {
      throw new Error("Agent not initialized");
    }
    return agent.getSession(sessionId);
  },
}));

// Initialize on app start
useAgentStore.getState().initialize();
```

```typescript
// components/ChatView.tsx
import { useEffect } from "react";
import { useAgentStore } from "~/stores/agentStore";

function ChatView({ sessionId }: { sessionId: string }) {
  const getSession = useAgentStore((state) => state.getSession);

  useEffect(() => {
    const session = getSession(sessionId);

    const handleSpeaking = ({ chunk }: any) => {
      console.log(chunk);
    };

    session.on("agent:speaking", handleSpeaking);

    return () => {
      session.off("agent:speaking", handleSpeaking);
    };
  }, [sessionId]);

  return <div>Chat View</div>;
}
```

## Available Events

All standard Session events are supported:

### Agent State Events
- `agent:idle`
- `agent:thinking`
- `agent:speaking`
- `agent:tool_calling`
- `agent:tool_waiting`
- `agent:error`
- `agent:completed`

### Message Events
- `message:user`
- `message:agent`
- `message:tool`

### Stream Events
- `stream:start`
- `stream:chunk`
- `stream:end`

### Session Lifecycle Events
- `session:created`
- `session:active`
- `session:idle`
- `session:completed`
- `session:error`
- `session:deleted`

### Persistence Events
- `persist:message:start`
- `persist:message:success`
- `persist:message:error`
- `persist:session:start`
- `persist:session:success`
- `persist:session:error`

## Configuration Options

```typescript
const agent = createBrowserAgent("ws://localhost:5200/ws", {
  // Auto-reconnect on disconnect (default: true)
  reconnect: true,

  // Initial reconnect delay in ms (default: 1000)
  reconnectDelay: 1000,

  // Max reconnect attempts (default: 5)
  maxReconnectAttempts: 5,
});
```

## Benefits Over Per-Session WebSocket

### Resource Efficiency
- ✅ 1 WebSocket vs N WebSockets
- ✅ Lower memory usage
- ✅ No browser connection limit issues

### Performance
- ✅ Faster session switching (no new connection)
- ✅ Shared connection state
- ✅ Less network overhead

### User Experience
- ✅ Instant session access
- ✅ Better for multi-session UIs
- ✅ Smoother reconnection

## Migration from BrowserSession

### Before (One WebSocket per Session)

```typescript
import { BrowserSession } from "@deepractice-ai/agent-sdk/browser";

const session1 = new BrowserSession("session-1", "ws://localhost:5200/ws");
const session2 = new BrowserSession("session-2", "ws://localhost:5200/ws");
// Creates 2 WebSocket connections!
```

### After (Single WebSocket)

```typescript
import { createBrowserAgent } from "@deepractice-ai/agent-sdk/browser";

const agent = createBrowserAgent("ws://localhost:5200/ws");
await agent.initialize();

const session1 = agent.getSession("session-1");
const session2 = agent.getSession("session-2");
// Only 1 WebSocket connection!
```

## Best Practices

1. **Initialize once**: Create BrowserAgent once at app startup
2. **Store globally**: Use global state (Zustand/Redux) or singleton
3. **Cleanup on unmount**: Remove event listeners when components unmount
4. **Handle reconnection**: Listen to agent-level events for connection state
5. **Error handling**: Always listen to `agent:error` events

## Troubleshooting

### "Agent not initialized"
```typescript
// Make sure to call initialize()
await agent.initialize();
```

### Events not firing
```typescript
// Check if session exists in agent
console.log(agent.hasSession(sessionId));

// Make sure session was created via HTTP API first
// BrowserAgent.getSession() doesn't create server-side session
```

### WebSocket disconnects
```typescript
// Use reconnect config
const agent = createBrowserAgent(wsUrl, {
  reconnect: true,
  maxReconnectAttempts: 10,
});

// Listen to connection events
agent.on("reconnecting", ({ attempt }) => {
  console.log(`Reconnecting... attempt ${attempt}`);
});
```
