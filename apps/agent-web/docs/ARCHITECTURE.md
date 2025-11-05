# Agent Web Architecture

**EventBus-Driven Business Layer with assistant-ui Components**

## Overview

agent-web implements a clean, layered architecture that separates business logic from UI rendering:

- **EventBus**: Unified RxJS Subject for all application events
- **Stores**: Zustand stores subscribed to EventBus
- **API Layer**: WebSocket + REST clients
- **UI Layer**: assistant-ui primitives for chat interface
- **Type System**: Shared type definitions for type safety

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│ UI Layer (assistant-ui primitives)     │
│ - Thread, Composer, Message components │
│ - Pure, composable React components    │
│ - Accepts runtime props                │
└─────────────────────────────────────────┘
         ↑ Runtime / ↓ Callbacks
┌─────────────────────────────────────────┐
│ agent-web (Business Layer)              │
│ ┌─────────────────────────────────────┐ │
│ │ AgentRuntimeProvider                │ │
│ │ - Adapts stores to assistant-ui     │ │
│ │ - Message format conversion         │ │
│ │ - Event handling                    │ │
│ └─────────────────────────────────────┘ │
│         ↓                                │
│ ┌─────────────────────────────────────┐ │
│ │ EventBus (RxJS Subject)             │ │
│ │ - Unified event stream              │ │
│ │ - Type-safe events                  │ │
│ └─────────────────────────────────────┘ │
│         ↓                                │
│ ┌─────────────────────────────────────┐ │
│ │ Stores (Zustand)                    │ │
│ │ - sessionStore                      │ │
│ │ - messageStore                      │ │
│ │ - uiStore                           │ │
│ └─────────────────────────────────────┘ │
│         ↓                                │
│ ┌─────────────────────────────────────┐ │
│ │ API Layer                           │ │
│ │ - WebSocket client                  │ │
│ │ - REST API client                   │ │
│ │ - Agent API facade                  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
         ↓ WebSocket / HTTP
┌─────────────────────────────────────────┐
│ agent-service (Backend)                 │
└─────────────────────────────────────────┘
```

## Component Structure

### UI Components (`components/`)

**Layout Components:**

- `Layout.tsx` - Two-column layout (Sidebar + Main)
- `SessionList.tsx` - Session management (CRUD)
- `ChatArea.tsx` - Chat interface using assistant-ui

**Runtime Provider:**

- `AgentRuntimeProvider.tsx` - Bridges Zustand stores to assistant-ui

All UI components are **pure** - they receive data via props/hooks and emit events via callbacks.

### assistant-ui Integration

We use **assistant-ui's External Store pattern**:

```typescript
// AgentRuntimeProvider.tsx
const runtime = useExternalStoreRuntime({
  messages,        // From messageStore
  setMessages,     // Updates messageStore
  onNew,          // Handles user input
});

<AssistantRuntimeProvider runtime={runtime}>
  <ChatArea />
</AssistantRuntimeProvider>
```

**Benefits:**

- Production-grade AI chat UX (streaming, auto-scroll, accessibility)
- Composable primitives (Thread, Composer, Message)
- Fully customizable with Tailwind CSS
- No business logic coupling

## Data Flow

### 1. User Sends Message

```
User types in Composer
    ↓
assistant-ui calls onNew()
    ↓
AgentRuntimeProvider.onNew()
    ↓
messageStore.addUserMessage()
    ↓
api/agent.sendMessage()
    ↓
WebSocket.send({ type: 'agent-command' })
```

### 2. Backend Responds

```
WebSocket receives message
    ↓
websocketAdapter.adaptWebSocketToEventBus()
    ↓
EventBus.emit({ type: 'message.assistant', content })
    ↓
messageStore subscribes and updates
    ↓
Runtime detects store change
    ↓
assistant-ui re-renders with new message
```

### 3. Session Management

```
User clicks "New Session"
    ↓
SessionList.handleNewSession()
    ↓
api/agent.createSession()
    ↓
EventBus.emit({ type: 'session.created' })
    ↓
sessionStore.addSession()
    ↓
UI re-renders with new session
```

## Core Systems

### EventBus (`core/eventBus.ts`)

Singleton RxJS Subject for all events:

```typescript
// Emit event
eventBus.emit({
  type: "session.created",
  sessionId: "abc",
});

// Subscribe to events
eventBus.on(isSessionEvent).subscribe((event) => {
  // Handle event
});
```

**Features:**

- Type-safe event types
- Automatic debug logging in dev
- Filter by event type with type guards

### Event Types (`core/events.ts`)

Type-safe event definitions:

- `SessionEvent` - Session lifecycle (created, updated, deleted, selected)
- `MessageEvent` - Message flow (user, assistant, streaming, complete)
- `UIEvent` - UI state (thinking status, errors)
- `ErrorEvent` - Error handling

### Stores (`stores/`)

Zustand stores subscribed to EventBus:

**sessionStore:**

- Sessions list
- Selected session
- Loading/error states

**messageStore:**

- Messages per session (Map<sessionId, ChatMessage[]>)
- Add/update/clear operations
- Streaming message handling

**uiStore:**

- UI preferences
- Persisted to localStorage

### API Layer (`api/`)

**websocket.ts:**

- WebSocket client with reconnection
- Message queue during disconnect
- Connection state management

**rest.ts:**

- REST API client with auth
- Session CRUD operations
- Message history loading

**agent.ts:**

- High-level API facade
- Combines WebSocket + REST
- Event emission

### Type System (`types/`)

Shared type definitions copied from original agent-ui:

- `Session` - Session metadata
- `ChatMessage` - User/Assistant/Error messages
- `WebSocketMessage` - WebSocket protocol types

## Key Design Decisions

### Why assistant-ui?

**Problem**: Building production-grade chat UI is complex (streaming, auto-scroll, accessibility, branching, etc.)

**Solution**: Use assistant-ui's proven, composable primitives

**Benefits:**

- Battle-tested UX patterns
- Radix-style composability
- Zero business logic coupling
- Full styling control
- Active maintenance (200k+ monthly downloads)

### Why External Store Pattern?

assistant-ui supports multiple patterns. We chose **External Store** because:

1. **We already have stores** (Zustand)
2. **EventBus architecture** is our source of truth
3. **Backend owns state** (WebSocket messages)
4. **Full control** over data flow

### Why EventBus?

**Problem**: Scattered WebSocket handlers, complex state sync

**Solution**: Single event stream with type-safe subscriptions

**Benefits:**

- Unified data flow (easy to trace)
- Type safety (compile-time guarantees)
- Testability (mock EventBus)
- Debug visibility (log all events)

### Why RxJS?

RxJS aligns with backend's Observable API:

```
Backend: agent-sdk Observable → agent-service → WebSocket
Frontend: WebSocket → EventBus (RxJS) → Stores → UI
```

### Why Zustand?

- Simple API (no boilerplate)
- Performance (selective subscriptions)
- DevTools support
- React 18 compatible

## Implementation Status

### ✅ Completed

- EventBus architecture with RxJS
- Zustand stores (session, message, ui)
- WebSocket adapter
- REST API client
- assistant-ui integration
- AgentRuntimeProvider
- Basic UI components (Layout, SessionList, ChatArea)
- Type system migration
- TypeScript strict mode compliance

### 🚧 In Progress

- Tailwind CSS styling
- Error handling UI
- Loading states
- Session history loading

### 📋 Future Enhancements

- Message editing/branching
- File attachments
- Tool use visualization
- Streaming indicators
- Markdown rendering
- Code syntax highlighting
- Dark mode

## Development Guide

### Starting Development

```bash
# Install dependencies
pnpm install

# Start dev server (both agent-service and agent-web)
pnpm dev

# Type check
pnpm --filter @deepractice-ai/agent-web typecheck

# Build
pnpm --filter @deepractice-ai/agent-web build
```

**Access:**

- Frontend: http://localhost:5200
- Backend: http://localhost:5201

### Adding a New Event Type

1. Define event in `core/events.ts`:

```typescript
export type MyEvent = {
  type: "my.event";
  data: string
};
export type AppEvent = ... | MyEvent;
```

2. Add type guard:

```typescript
export const isMyEvent = (e: AppEvent): e is MyEvent => e.type.startsWith("my.");
```

3. Subscribe in store:

```typescript
eventBus.on(isMyEvent).subscribe((event) => {
  // Handle event
});
```

### Adding a New UI Component

1. Create component in `components/`:

```typescript
// components/MyComponent.tsx
export function MyComponent() {
  const data = useSessionStore((s) => s.someData);

  return <div>{data}</div>;
}
```

2. Import and use in App:

```typescript
import { MyComponent } from "~/components/MyComponent";
```

### Message Format Conversion

assistant-ui uses `ThreadMessageLike` format. We convert:

**Our format → assistant-ui:**

```typescript
{
  type: "user",
  content: "Hello",
  timestamp: "2025-11-05T..."
}
// ↓
{
  role: "user",
  content: [{ type: "text", text: "Hello" }]
}
```

**assistant-ui → Our format:**

```typescript
{
  role: "assistant",
  content: [{ type: "text", text: "Hi" }]
}
// ↓
{
  type: "assistant",
  content: "Hi",
  timestamp: "2025-11-05T..."
}
```

### Debugging

**EventBus logging:**

```
[EventBus] session.created { type: 'session.created', sessionId: 'abc123' }
```

**Store logging:**

```typescript
// Enable Zustand devtools
const useSessionStore = create(
  devtools(
    (set) => ({...}),
    { name: 'SessionStore' }
  )
);
```

**WebSocket logging:**
Check browser console for WebSocket messages.

## Architecture Principles

### 1. Separation of Concerns

- **UI**: Pure components, no business logic
- **Business**: Stores + EventBus, no UI code
- **Data**: API layer, no UI/business logic

### 2. Unidirectional Data Flow

```
User Action → API → Backend → WebSocket →
EventBus → Stores → UI Re-render
```

### 3. Type Safety

Every layer is fully typed:

- Events have union types
- Stores have interfaces
- API has typed responses
- Components have typed props

### 4. Testability

- Mock EventBus for store tests
- Mock stores for component tests
- Mock WebSocket for integration tests

### 5. Performance

- Selective Zustand subscriptions (only re-render what changed)
- assistant-ui optimizations (virtualization, memoization)
- WebSocket message batching

## Migration from agent-ui

We replaced the monolithic `agent-ui` package with:

1. **assistant-ui** - UI components
2. **Local types** - Type definitions in `agent-web/src/types/`
3. **Pure components** - No stores, hooks, or utils

**Benefits:**

- Smaller bundle size
- Better maintainability
- Production-grade UI patterns
- Clear architecture boundaries

---

**Last Updated**: 2025-11-05
**Status**: ✅ Phase 1 Complete - MVP functional
