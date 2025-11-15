# Session Context

**Session** is a conversation container that holds multiple messages. It represents a complete dialogue between user and AI, providing temporal and organizational structure for message history.

## Design Principles

### 1. Pure Data Structure

Session is a **data container**, not a behavioral object:

- No methods or business logic
- No runtime state (like `status: 'active' | 'streaming'`)
- Can be easily serialized/deserialized (JSON-compatible)
- Suitable for various storage backends (file, database, memory)

### 2. Minimal Core, Extensible Metadata

Core fields are minimal and essential:

- `id`, `title`, `messages` - identity and content
- `createdAt`, `updatedAt` - temporal tracking
- `metadata` - flexible extension point for application-layer features

### 3. Separation of Concerns

Session types define **what data exists**, not **how to manipulate it**:

- CRUD operations → implemented in `agentx-core/SessionManager`
- Fork/clone operations → implemented in `agentx-core`
- Persistence → implemented by `SessionPersister` interface
- UI state → maintained separately in application layer

## Types

### Session

```typescript
interface Session {
  /** Unique identifier */
  id: string;

  /** Session title */
  title: string;

  /** All messages in this session */
  messages: Message[];

  /** When this session was created */
  createdAt: Date;

  /** When this session was last updated */
  updatedAt: Date;

  /**
   * Optional metadata for application-layer extensions
   * Examples: tags, categories, userId, fork relationships, etc.
   */
  metadata?: Record<string, unknown>;
}
```

## Usage Examples

### Basic Session

```typescript
import { Session, Message } from "@deepractice-ai/agentx-types";

const session: Session = {
  id: "session_123",
  title: "Product Requirements Discussion",
  messages: [],
  createdAt: new Date("2025-01-01T10:00:00Z"),
  updatedAt: new Date("2025-01-01T10:30:00Z"),
};
```

### Session with Metadata

```typescript
// Application-layer can extend metadata for business needs
const sessionWithMetadata: Session = {
  id: 'session_456',
  title: 'Bug Fix: Authentication Issue',
  messages: [...],
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {
    // User tracking
    userId: 'user_789',

    // Organization
    tags: ['bug', 'auth', 'urgent'],
    category: 'backend',

    // Fork relationships (for session branching)
    parentSessionId: 'session_123',
    forkPointMessageId: 'msg_45',

    // Custom fields
    isArchived: false,
    priority: 'high',
  },
};
```

### Session with Messages

```typescript
const session: Session = {
  id: "session_001",
  title: "Getting Started",
  messages: [
    {
      id: "msg_1",
      role: "user",
      content: "How do I create a REST API?",
      timestamp: new Date("2025-01-01T10:00:00Z"),
    },
    {
      id: "msg_2",
      role: "assistant",
      content: "To create a REST API, you need...",
      timestamp: new Date("2025-01-01T10:00:05Z"),
      usage: { input: 20, output: 150 },
    },
  ],
  createdAt: new Date("2025-01-01T10:00:00Z"),
  updatedAt: new Date("2025-01-01T10:00:05Z"),
};
```

## Metadata Usage Patterns

### Fork Relationships

When implementing session forking (handled in `agentx-core`):

```typescript
// Original session
const original: Session = {
  id: 'session_100',
  title: 'Original Conversation',
  messages: [...],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Forked session (created by SessionManager.fork())
const forked: Session = {
  id: 'session_101',
  title: 'Original Conversation (fork)',
  messages: original.messages.slice(0, 5), // up to fork point
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {
    parentSessionId: 'session_100',
    forkPointMessageId: 'msg_5',
  },
};
```

### User and Organization

```typescript
const session: Session = {
  id: 'session_200',
  title: 'Team Planning',
  messages: [...],
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {
    userId: 'user_alice',
    organizationId: 'org_acme',
    teamId: 'team_engineering',
  },
};
```

### Tags and Categories

```typescript
const session: Session = {
  id: 'session_300',
  title: 'UI Component Design',
  messages: [...],
  createdAt: new Date(),
  updatedAt: new Date(),
  metadata: {
    tags: ['design', 'frontend', 'react'],
    category: 'ui-ux',
    project: 'web-app-v2',
  },
};
```

### Archival and Lifecycle

```typescript
const session: Session = {
  id: 'session_400',
  title: 'Resolved: Login Bug',
  messages: [...],
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-15'),
  metadata: {
    status: 'resolved',
    isArchived: true,
    archivedAt: new Date('2025-01-15'),
    resolution: 'Fixed in PR #123',
  },
};
```

## Design Rationale

### Why No `status` Field?

Runtime state like `'active' | 'streaming' | 'error'` should be maintained separately:

- **Persistence**: Session is persisted data; status is transient runtime state
- **Separation**: UI state management should not pollute data model
- **Flexibility**: Different apps may need different status values

```typescript
// ❌ Don't add runtime state to Session type
interface Session {
  id: string;
  status: "active" | "streaming" | "idle"; // ❌ Runtime state
  isLoading: boolean; // ❌ UI state
}

// ✅ Maintain runtime state separately
interface SessionWithRuntime extends Session {
  // Application layer adds runtime state
  status: "active" | "idle" | "archived";
  isStreaming: boolean;
}
```

### Why `metadata?: Record<string, unknown>`?

- **Flexibility**: Different applications have different needs
- **Extensibility**: No need to modify core types for new features
- **Type Safety**: Can be type-narrowed at application layer
- **Forward Compatibility**: Core types remain stable

```typescript
// Application layer can define specific metadata types
interface MySessionMetadata {
  userId: string;
  tags: string[];
  priority: "low" | "medium" | "high";
}

type MySession = Omit<Session, "metadata"> & {
  metadata?: MySessionMetadata;
};
```

## Related Types

- **Message**: See `~/message/README.md` - Individual conversation turns
- **LLMRequest**: See `~/llm/README.md` - Stateless inference with messages

## Operations (Implemented in agentx-core)

Session types define data; operations are implemented elsewhere:

```typescript
// agentx-core/session/SessionManager.ts
class SessionManager {
  create(params: CreateSessionParams): Session;
  get(id: string): Session | null;
  update(id: string, updates: Partial<Session>): Session;
  delete(id: string): void;

  // Advanced operations
  fork(sessionId: string, fromMessageId?: string): Session;
  merge(sessionIds: string[]): Session;
  export(sessionId: string): SessionExport;
}
```

See `agentx-core` package for implementation details.
