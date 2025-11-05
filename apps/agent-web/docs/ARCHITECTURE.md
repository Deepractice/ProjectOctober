# Agent Web Architecture

**EventBus-Driven Business Layer with Migrated agent-ui Components**

## Overview

agent-web implements a clean, layered architecture that separates business logic from UI rendering:

- **EventBus**: Unified RxJS Subject for all application events
- **Stores**: Zustand stores subscribed to EventBus
- **API Layer**: WebSocket + REST clients
- **UI Layer**: Migrated components from agent-ui package
- **Type System**: Shared type definitions for type safety

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│ UI Layer (Migrated Components)          │
│ - Sidebar, ChatInterface, MessagesArea │
│ - InputArea, MessageRenderer           │
│ - Pure, composable React components    │
└─────────────────────────────────────────┘
         ↑ Props / ↓ Events
┌─────────────────────────────────────────┐
│ agent-web (Business Layer)              │
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
- `Sidebar/` - Session management with sub-components:
  - `SidebarHeader.tsx` - Logo and branding
  - `SessionSearchBar.tsx` - Search and actions
  - `SessionList.tsx` - Session list container
  - `SessionItem.tsx` - Individual session card
- `ChatInterface.tsx` - Main chat container

**Chat Components:**
- `MessagesArea/` - Message list with pagination
- `MessageRenderer/` - Message rendering with sub-components:
  - `UserMessage.tsx` - User message bubble
  - `AssistantMessage.tsx` - AI response with thinking
  - `MessageHeader.tsx` - Message metadata
  - `ThinkingSection.tsx` - Collapsible reasoning
  - `JSONRenderer.tsx` - Formatted JSON display
  - `ToolUseDisplay.tsx` - Tool execution visualization
  - `DiffDisplay.tsx` - File diff rendering
  - `ToolIndicators/` - Read/Todo tool indicators
- `InputArea/` - User input with sub-components:
  - `Textarea.tsx` - Auto-resizing textarea
  - `ActionButtons.tsx` - Submit, image upload, etc.
  - `ImageAttachments.tsx` - Image preview and drag-drop

**Utility Components:**
- `AgentLogo.tsx` - Branding logo
- `AgentStatus.tsx` - Thinking/processing indicator with framer-motion
- `TodoList.tsx` - Task list visualization
- `TokenUsagePie.tsx` - Token usage pie chart
- `CommandMenu.tsx` - Slash command autocomplete
- `MicButton.tsx` - Voice input with Whisper API
- `CodeEditor.tsx` - Code editing (requires CodeMirror packages)
- `DiffViewer.tsx` - Diff visualization
- `ImageAttachment.tsx` - Image preview card

All UI components are **pure** - they receive data via props/hooks and emit events via callbacks.

## Data Flow

### 1. User Sends Message

```
User types in InputArea
    ↓
handleSubmit()
    ↓
api/agent.sendMessage()
    ↓
EventBus.emit({ type: 'message.user' })
    ↓
messageStore.addUserMessage()
    ↓
WebSocket.send({ type: 'agent-command' })
```

### 2. Backend Responds

```
WebSocket receives message
    ↓
websocketAdapter processes
    ↓
EventBus.emit({ type: 'message.assistant', content })
    ↓
messageStore subscribes and updates
    ↓
ChatInterface re-renders with new message
```

### 3. Session Management

```
User clicks "New Session" in Sidebar
    ↓
EventBus.emit({ type: 'session.create' })
    ↓
sessionStore handles event
    ↓
api/agent.createSession()
    ↓
Sessions list refreshed
    ↓
Navigate to new session
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
eventBus.stream().subscribe((event: AppEvent) => {
  // Handle event
});
```

**Features:**
- Type-safe event types
- Automatic debug logging in dev
- Observable-based subscriptions

### Event Types (`core/events.ts`)

Type-safe event definitions:

- `SessionEvent` - Session lifecycle (create, created, updated, deleted, selected, refresh)
- `MessageEvent` - Message flow (user, assistant, streaming, complete, tool, toolResult, error)
- `UIEvent` - UI state (thinking status, errors)

### Stores (`stores/`)

Zustand stores subscribed to EventBus:

**sessionStore:**
- Sessions list
- Selected session
- Loading/error states
- **NEW**: Handles session CRUD via EventBus events
  - `session.create` → calls API → refreshes list
  - `session.delete` → calls API → removes from list
  - `session.refresh` → reloads sessions

**messageStore:**
- Messages per session (Map<sessionId, ChatMessage[]>)
- Add/update/clear operations
- Streaming message handling
- Tool use tracking
- Automatically subscribes to message events

**uiStore:**
- UI preferences (autoExpandTools, showRawParameters, showThinking)
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
- File operations
- Whisper transcription

**agent.ts:**
- High-level API facade
- `sendMessage()` - Send user message
- `createSession()` - Create new session
- `deleteSession()` - Delete session
- `loadSessions()` - Load session list
- `connectWebSocket()` / `disconnectWebSocket()`

### Type System (`types/`)

Shared type definitions:
- `Session` - Session metadata (id, title, created_at, updated_at, summary, lastActivity, messageCount)
- `ChatMessage` - User/Assistant/Error/Tool messages
- `ProjectInfo` - Project metadata
- `WebSocketMessage` - WebSocket protocol types

## Key Design Decisions

### Why Migrate from assistant-ui to agent-ui Components?

**Problem**: assistant-ui has high adaptation costs and lacks many needed components

**Solution**: Gradually migrate agent-ui components, transforming them to work with EventBus + Zustand

**Benefits:**
- Full control over UI behavior
- All needed components (TodoList, DiffDisplay, ToolUseDisplay, etc.)
- Easier customization
- No adapter layer needed
- Incremental migration path

### Migration Strategy

1. **Phase 1**: Migrate core components (Sidebar, ChatInterface, MessagesArea, InputArea)
2. **Refactor**: Split large components into smaller, single-responsibility components
3. **Transform**: Convert from Context API to Zustand + EventBus
4. **Result**: Pure components that receive props and emit events

### Component Refactoring Principles

- **One file, one component**: Each component in its own file
- **Single responsibility**: Components do one thing well
- **Composition over monoliths**: Build complex UIs from simple pieces
- **Props down, events up**: Unidirectional data flow

Example: Sidebar was split into:
- `SidebarHeader` - Branding
- `SessionSearchBar` - Search + Actions
- `SessionList` - List container
- `SessionItem` - Individual item

### Why EventBus?

**Problem**: Scattered WebSocket handlers, complex state sync

**Solution**: Single event stream with type-safe subscriptions

**Benefits:**
- Unified data flow (easy to trace)
- Type safety (compile-time guarantees)
- Testability (mock EventBus)
- Debug visibility (log all events)

### Why Zustand?

- Simple API (no boilerplate)
- Performance (selective subscriptions)
- DevTools support
- React 18 compatible
- Works great with EventBus pattern

## Implementation Status

### ✅ Completed

- EventBus architecture with RxJS
- Zustand stores (session, message, ui)
- WebSocket adapter
- REST API client
- **Component migration:**
  - Sidebar with sub-components
  - ChatInterface
  - MessagesArea
  - MessageRenderer with sub-components
  - InputArea with sub-components
  - Utility components (AgentStatus, TodoList, TokenUsagePie, CommandMenu, MicButton, ImageAttachment)
- Type system migration
- Session CRUD via EventBus
- Message display and streaming
- Framer Motion animations

### 🚧 In Progress

- CodeEditor (missing CodeMirror packages)
- Error boundaries
- Loading states polish
- Auto-scroll to bottom

### 📋 Future Enhancements

- Message editing/branching
- Complete file attachment support
- Enhanced tool use visualization
- Dark mode toggle
- Keyboard shortcuts
- Search in messages
- Export conversations

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

### Adding a New Component

1. Create component file in `components/`:

```typescript
// components/MyComponent.tsx
export function MyComponent({ data, onAction }: MyComponentProps) {
  return (
    <div onClick={() => onAction(data.id)}>
      {data.content}
    </div>
  );
}

export default MyComponent;
```

2. Use in parent component:

```typescript
import MyComponent from "~/components/MyComponent";

<MyComponent data={item} onAction={handleAction} />
```

### Connecting to Stores

```typescript
import { useSessionStore } from "~/stores/sessionStore";
import { useMessageStore } from "~/stores/messageStore";

function MyComponent() {
  // Subscribe to specific state
  const sessions = useSessionStore((state) => state.sessions);
  const getMessages = useMessageStore((state) => state.getMessages);

  const messages = getMessages(sessionId);

  return <div>{/* ... */}</div>;
}
```

### Emitting Events

```typescript
import { eventBus } from "~/core/eventBus";

function handleAction() {
  eventBus.emit({
    type: "session.create"
  });
}
```

### Debugging

**EventBus logging** (auto-enabled in dev):
```
[EventBus] session.create { type: 'session.create' }
[EventBus] message.user { type: 'message.user', sessionId: '...', content: '...' }
```

**Store logging:**
```
[SessionStore] Creating new session...
[SessionStore] Session created: abc123
[MessageStore] User message added: abc123
```

**React DevTools:**
- Use Zustand DevTools extension to inspect store state

## Architecture Principles

### 1. Separation of Concerns

- **UI**: Pure components, no business logic
- **Business**: Stores + EventBus, no UI code
- **Data**: API layer, no UI/business logic

### 2. Unidirectional Data Flow

```
User Action → Event → Store → UI Re-render
     ↓
   API → Backend → WebSocket → Event → Store → UI
```

### 3. Type Safety

Every layer is fully typed:
- Events have discriminated union types
- Stores have TypeScript interfaces
- API has typed responses
- Components have typed props

### 4. Component Composition

Build complex UIs from simple, reusable pieces:
- Sidebar = Header + SearchBar + List
- MessageRenderer = Header + (UserMessage | AssistantMessage | ToolUse)
- InputArea = Textarea + ActionButtons + ImageAttachments

### 5. Performance

- Selective Zustand subscriptions (only re-render what changed)
- Component memoization where needed
- Efficient message list rendering
- WebSocket message batching

## Migration from agent-ui Package

We migrated components from the monolithic `agent-ui` package:

**Strategy:**
1. Copy components from `packages/agent-ui/src/components`
2. Refactor into smaller sub-components
3. Convert Context API → Zustand hooks
4. Convert callbacks → EventBus events
5. Update imports to use `~/` alias
6. Add TypeScript types

**Benefits:**
- Full control over components
- Better maintainability (smaller files)
- Clear architecture boundaries
- EventBus-driven data flow
- Incremental migration path

**Example Migration:**

Before (agent-ui):
```typescript
// Large monolithic component with Context
function Sidebar() {
  const { sessions, selectSession } = useSessionContext();
  // 200+ lines of code...
}
```

After (agent-web):
```typescript
// Split into focused components
function Sidebar() {
  const sessions = useSessionStore(s => s.sessions);

  const handleSelect = (session) => {
    eventBus.emit({ type: 'session.selected', sessionId: session.id });
  };

  return (
    <>
      <SidebarHeader />
      <SessionSearchBar />
      <SessionList sessions={sessions} onSelect={handleSelect} />
    </>
  );
}
```

## Dependencies

**UI & Styling:**
- React 18.2
- Tailwind CSS
- Framer Motion 12.x (animations)
- Lucide React (icons)
- class-variance-authority, clsx, tailwind-merge (styling utilities)

**State & Data:**
- Zustand 5.x (state management)
- RxJS 7.x (EventBus)
- React Router DOM 6.x (routing)

**Markdown & Content:**
- react-markdown 10.x
- remark-gfm 4.x

**Search:**
- fuse.js 7.x (fuzzy search)

**Missing (TODO):**
- CodeMirror packages (for CodeEditor component)

---

**Last Updated**: 2025-11-05
**Status**: ✅ Phase 1 Complete - Core components migrated and functional
**Next**: Polish UI/UX, add missing features (CodeEditor, enhanced error handling)
