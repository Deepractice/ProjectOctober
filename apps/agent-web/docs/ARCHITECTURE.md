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
┌────────────────────────────────────────────────────────┐
│ UI Layer (Migrated Components)                         │
│ - HeaderNav, Sidebar, ChatInterface, MessagesArea     │
│ - InputArea, MessageRenderer, AgentStatus             │
│ - Pure, composable React components                   │
└────────────────────────────────────────────────────────┘
         ↑ Props (from stores) / ↓ Events (to EventBus)
┌────────────────────────────────────────────────────────┐
│ agent-web (Business Layer)                             │
│ ┌────────────────────────────────────────────────────┐ │
│ │ EventBus (RxJS Subject)                            │ │
│ │ - Unified event stream for all events              │ │
│ │ - Type-safe discriminated unions                   │ │
│ └────────────────────────────────────────────────────┘ │
│         ↓ subscribe & emit                             │
│ ┌────────────────────────────────────────────────────┐ │
│ │ Stores (Zustand) - Subscribe to EventBus           │ │
│ │ ┌────────────────────────────────────────────────┐ │ │
│ │ │ sessionStore                                   │ │ │
│ │ │ - Sessions list & selected session             │ │ │
│ │ │ - processingSessions: Set<SessionId>           │ │ │
│ │ │ - activeSessions protection                    │ │ │
│ │ └────────────────────────────────────────────────┘ │ │
│ │ ┌────────────────────────────────────────────────┐ │ │
│ │ │ messageStore                                   │ │ │
│ │ │ - Messages per session Map<sessionId, msgs[]>  │ │ │
│ │ │ - Streaming, tool use, content handling        │ │ │
│ │ └────────────────────────────────────────────────┘ │ │
│ │ ┌────────────────────────────────────────────────┐ │ │
│ │ │ uiStore                                        │ │ │
│ │ │ - UI preferences (persisted to localStorage)   │ │ │
│ │ │ - agentStatus (for current session, NOT saved) │ │ │
│ │ │ - provider ("claude" | "cursor")               │ │ │
│ │ └────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────┘ │
│         ↓ API calls                                    │
│ ┌────────────────────────────────────────────────────┐ │
│ │ API Layer                                          │ │
│ │ - WebSocket client (reconnection, message queue)   │ │
│ │ - WebSocket adapter (converts WS → EventBus)       │ │
│ │ - REST API client (auth, CRUD operations)          │ │
│ │ - Agent API facade (high-level operations)         │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
         ↓ WebSocket / HTTP
┌────────────────────────────────────────────────────────┐
│ agent-service (Backend)                                │
└────────────────────────────────────────────────────────┘
```

## Component Structure

### UI Components (`components/`)

**Layout Components:**

- `App.tsx` - Main layout (Sidebar left, HeaderNav + Content right)
- `HeaderNav.tsx` - Top navigation bar with session title and tab switching (Chat/Shell/Files)
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
- `AgentStatus.tsx` - Thinking/processing indicator with countdown timer and framer-motion animations
- `AgentStatusBar.tsx` - Status bar wrapper component
- `TodoList.tsx` - Task list visualization
- `TokenUsagePie.tsx` - Token usage pie chart
- `CommandMenu.tsx` - Slash command autocomplete
- `MicButton.tsx` - Voice input with Whisper API
- `CodeEditor.tsx` - Code editing (requires CodeMirror packages)
- `DiffViewer.tsx` - Diff visualization
- `ImageAttachment.tsx` - Image preview card

All UI components are **pure** - they receive data via props/hooks and emit events via callbacks.

## Agent Status Architecture

### Multi-Session Agent Status Management

**Problem**: How to manage agent processing state across multiple sessions?

**Solution**: Two-tier architecture

1. **SessionStore** - Tracks processing state for ALL sessions
   - `processingSessions: Set<SessionId>` - which sessions are being processed
   - Persistent across session switches
   - Each session's processing state is independent

2. **UIStore** - Displays status for CURRENT session only
   - `agentStatus: AgentStatus | null` - status text, tokens, can_interrupt
   - `provider: "claude" | "cursor"` - which AI provider
   - Temporary display state (not persisted)
   - Cleared when switching sessions

### Agent Status Flow

```
User sends message in Session A
  ↓
EventBus emit "message.user" (sessionId: A)
  ↓
UIStore: set agentStatus = { text: "Thinking..." }
SessionStore: add A to processingSessions
  ↓
WebSocket receives "agent.processing" (sessionId: A, status, tokens)
  ↓
UIStore: update agentStatus = { text: status, tokens }
  ↓
Agent completes → "agent.complete" (sessionId: A)
  ↓
UIStore: clear agentStatus
SessionStore: remove A from processingSessions
```

### Multi-Session Scenario

```
Scenario: User has Session A processing, switches to Session B

1. Session A starts processing:
   - SessionStore.processingSessions = { A }
   - UIStore.agentStatus = { text: "Thinking...", ... }

2. User clicks Session B:
   - EventBus emit "session.selected" (sessionId: B)
   - UIStore.agentStatus = null (cleared)
   - SessionStore.processingSessions = { A } (unchanged)

3. Session A completes in background:
   - EventBus emit "agent.complete" (sessionId: A)
   - SessionStore.processingSessions = {} (A removed)
   - UIStore.agentStatus = null (unchanged, B is selected)

4. User switches back to Session A:
   - isSessionProcessing(A) = false
   - No loading indicator shown
```

### Benefits

✅ Each session's processing state is independent
✅ UI only shows current session's status
✅ Background sessions can complete without affecting UI
✅ No state confusion when switching sessions
✅ Scalable to many concurrent sessions

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

- `SessionEvent` - Session lifecycle (create, created, updated, deleted, selected, refresh, processing, aborted)
- `MessageEvent` - Message flow (user, assistant, streaming, complete, tool, toolResult, error)
- `AgentEvent` - Agent processing state (thinking, processing, complete, error, abort)
- `UIEvent` - UI state (loading, thinking, toast)
- `ErrorEvent` - Error handling (websocket, api, unknown)

### Stores (`stores/`)

Zustand stores subscribed to EventBus:

**sessionStore:**

- Sessions list
- Selected session
- Loading/error states
- **Session processing state** (`processingSessions: Set<SessionId>`) - tracks which sessions are being processed by agent
- **Session protection system** (`activeSessions`) - prevents accidental deletion
- Handles session CRUD via EventBus events:
  - `session.create` → calls API → refreshes list
  - `session.delete` → calls API → removes from list
  - `session.refresh` → reloads sessions
  - `session.processing` → updates processing state
  - `session.aborted` → clears processing state

**messageStore:**

- Messages per session (Map<sessionId, ChatMessage[]>)
- Add/update/clear operations
- Streaming message handling
- Tool use tracking
- Automatically subscribes to message events

**uiStore:**

- UI preferences (autoExpandTools, showRawParameters, showThinking, autoScrollToBottom, sendByCtrlEnter, sidebarVisible)
- **Agent status display** (agentStatus, provider) - for current session only
- Persisted to localStorage (preferences only, not agent status)

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
- **Agent Status Architecture:**
  - Multi-session processing state management
  - SessionStore tracks all processing sessions
  - UIStore displays current session status only
  - AgentStatus component with countdown timer
  - Agent events (thinking, processing, complete, error, abort)
- WebSocket adapter with agent event emission
- REST API client
- **Component migration:**
  - HeaderNav with tab switching (Chat/Shell/Files)
  - Sidebar with sub-components
  - ChatInterface
  - MessagesArea
  - MessageRenderer with sub-components (including ThinkingSection)
  - InputArea with sub-components
  - Utility components (AgentStatus, AgentStatusBar, TodoList, TokenUsagePie, CommandMenu, MicButton, ImageAttachment)
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
    type: "session.create",
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

### Core Principle: Store as Service/Facade Layer

**Store is the unified entry point** - Components only interact with Stores, never directly with EventBus or API.

```
Component (UI Layer)
    ↓ Read data via zustand hooks
    ↓ Trigger actions via API facade functions
Store (Service/Business Layer)
    ↓ Subscribe to EventBus
    ↓ Orchestrate business logic
    ↓ Call API when needed
EventBus (Event Stream)
    ↓ Emit events
API Layer (Network)
    ↓ Pure network requests
Backend
```

### 1. Separation of Concerns

**UI Layer (Components):**

- Pure React components
- No business logic
- No direct EventBus access
- No direct WebSocket/API calls
- Only interact with Stores via:
  - Zustand hooks for reading data
  - API facade functions for actions (which internally emit events)

**Business Layer (Stores):**

- Subscribe to EventBus events
- Orchestrate multi-step business logic
- Coordinate API calls
- Manage application state
- Emit events when needed

**Event Layer (EventBus):**

- Pure event stream
- No business logic
- Just emit and subscribe

**API Layer:**

- Pure network requests (REST + WebSocket)
- No business logic
- Optionally emit events (for backward compatibility)

### 2. Event Types: Action vs State Update

Events are categorized into two types:

**Action Events** (User intent):

- `session.create` - User wants to create session
- `session.delete` - User wants to delete session
- `session.abort` - User wants to abort session
- `message.send` - User wants to send message

**State Update Events** (System state change):

- `session.created` - Session was created
- `session.deleted` - Session was deleted
- `session.aborted` - Session was aborted
- `message.user` - User message was added to store

**Flow:**

```
User clicks → API facade → emit action event → Store handles → orchestrate logic → emit state events
```

### 3. Store Responsibilities

**What Stores SHOULD do:**

1. **Listen to EventBus** - Subscribe to all relevant events
2. **Business Orchestration** - Coordinate multi-step operations
   - Example: `session.selected` → setSelectedSession + loadMessages
3. **API Coordination** - Call APIs at the right time
4. **State Management** - Maintain application state
5. **Derived State** - Calculate derived data (e.g., processingSessions)

**What Stores SHOULD NOT do:**

1. Pure event forwarding (event → store → same event)
2. One-to-one event-to-state mapping with no logic
3. UI rendering logic

### 4. Component Guidelines

**✅ DO:**

```typescript
// Read data from Store
const messages = useMessageStore((state) => state.sessionMessages.get(sessionId) || []);

// Use API facade for actions
await sendMessage(sessionId, content);

// Or emit events via API facade
eventBus.emit({ type: "session.selected", sessionId });
```

**❌ DON'T:**

```typescript
// Direct EventBus subscription in components
useEffect(() => {
  const sub = eventBus.on(isMessageEvent).subscribe(...);
}, []);

// Direct WebSocket calls
wsClient.send({ type: "agent-command", ... });

// Direct business logic
if (messages.length === 0 && !isLoading) {
  loadMessages(); // This should be in Store
}
```

### 5. Zustand Subscription Best Practices

**Problem:** Subscribing to derived data can cause infinite loops

**Solution:** Subscribe to stable references, not computed values

```typescript
// ❌ BAD: Can cause infinite loops
const chatMessages = useMessageStore((state) =>
  selectedSession ? state.sessionMessages.get(selectedSession.id) || [] : []
);

// ✅ GOOD: Use local state + useEffect subscription
const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

useEffect(() => {
  if (!selectedSession) return;

  const updateMessages = () => {
    const messages = useMessageStore.getState().getMessages(selectedSession.id);
    setChatMessages(messages);
  };

  updateMessages();
  return useMessageStore.subscribe(updateMessages);
}, [selectedSession?.id]);
```

### 6. Type Safety

Every layer is fully typed:

- Events have discriminated union types
- Stores have TypeScript interfaces
- API has typed responses
- Components have typed props

### 7. Component Composition

Build complex UIs from simple, reusable pieces:

- Sidebar = Header + SearchBar + List
- MessageRenderer = Header + (UserMessage | AssistantMessage | ToolUse)
- InputArea = Textarea + ActionButtons + ImageAttachments

### 8. Performance

- Selective Zustand subscriptions (only re-render what changed)
- Component memoization where needed
- Efficient message list rendering
- WebSocket message batching

### 9. Unidirectional Data Flow

```
Component: User clicks send
    ↓
API facade: sendMessage()
    ↓
EventBus: emit("message.send")
    ↓
MessageStore:
    - Add message to UI
    - Mark session active
    - Send to WebSocket
    - emit("message.user")
    ↓
Component: Re-render with new message
```

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
**Status**: ✅ Architecture Refactored - Store as Service/Facade Layer

**Architecture Highlights**:

- **Store as unified entry point** - Components only interact with Stores
- **EventBus-driven business orchestration** - Stores subscribe to events and coordinate logic
- **Action vs State events** - Clear distinction between user intent and state changes
- **Type-safe event system** - Discriminated unions for all events
- **Clean separation of concerns** - UI / Business / Event / API layers

**Key Learnings**:

1. **Don't bypass Store** - Components should never directly call EventBus or WebSocket
2. **Store orchestrates** - Multi-step business logic belongs in Stores, not Components
3. **Zustand subscription traps** - Be careful with derived state subscriptions, use local state + useEffect when needed
4. **Session selection auto-loads messages** - Automatic business orchestration in sessionStore

**Next**:

- Shell tab integration (xterm.js)
- Files tab (file browser)
- Code editor polish (CodeMirror deps)
- Enhanced error handling
- Remove debug logging from production
