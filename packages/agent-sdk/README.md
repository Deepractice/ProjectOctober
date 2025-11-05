# @deepractice-ai/agent-sdk

High-performance Agent SDK with RxJS event-driven architecture and warmup pool optimization.

## Features

- **10x Performance**: Warmup pool reduces cold start from 5.2s to <1s
- **RxJS Event Streams**: Native reactive programming for streaming AI responses
- **Type-Safe**: Full TypeScript support with strict mode
- **Clean Architecture**: api/core/types layered design
- **Well-Tested**: BDD-driven development with Cucumber

## Installation

```bash
pnpm add @deepractice-ai/agent-sdk
```

## Quick Start

```typescript
import { Agent } from "@deepractice-ai/agent-sdk";

// Initialize agent with warmup pool
const agent = new Agent({
  workspace: "/path/to/project",
  warmupPoolSize: 3,
  model: "claude-sonnet-4",
});

await agent.initialize();

// Quick chat
const session = await agent.chat("Explain RxJS");

// Subscribe to streaming messages
session.messages$().subscribe({
  next: (message) => console.log(message),
  error: (err) => console.error(err),
  complete: () => console.log("Response complete"),
});
```

## API

### Agent

```typescript
class Agent {
  constructor(config: AgentConfig);

  // Lifecycle
  initialize(): Promise<void>;
  destroy(): void;

  // Session management
  createSession(options?: SessionOptions): Promise<Session>;
  getSession(id: string): Session | null;
  getSessions(limit?: number, offset?: number): Session[];

  // Quick API
  chat(message: string, options?: SessionOptions): Promise<Session>;

  // Observables
  sessions$(): Observable<SessionEvent>;

  // Status
  getStatus(): AgentStatus;
}
```

### Session

```typescript
class Session {
  readonly id: string;
  readonly state: SessionState;

  // Actions
  send(content: string): Promise<void>;
  abort(): Promise<void>;
  delete(): Promise<void>;

  // Observables
  messages$(): Observable<AnyMessage>;

  // Queries
  getMessages(limit?: number, offset?: number): AnyMessage[];
  getTokenUsage(): TokenUsage;
  getMetadata(): SessionMetadata;
}
```

## Architecture

```
packages/agent-sdk/
├── src/
│   ├── api/           # Public exports
│   │   ├── Agent.ts
│   │   ├── Session.ts
│   │   └── index.ts
│   ├── types/         # Type definitions
│   │   ├── Message.ts
│   │   ├── Config.ts
│   │   └── index.ts
│   └── core/          # Internal (not exported)
│       ├── SessionManager.ts
│       ├── WarmupPool.ts
│       ├── MessageStream.ts
│       └── ClaudeAdapter.ts
├── features/          # BDD tests
└── tests/
    ├── support/       # Test setup
    └── steps/         # Step definitions
```

## Performance

### Warmup Pool

The SDK maintains a pool of pre-initialized sessions:

- **Cold start**: ~5.2s (no warmup)
- **Warm start**: <1s (from pool)
- **Automatic refill**: Pool maintains configured size

### Configuration

```typescript
const agent = new Agent({
  workspace: "/path/to/project",
  warmupPoolSize: 3, // Number of pre-warmed sessions
  model: "claude-sonnet-4",
});
```

## Testing

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage

# UI
pnpm test:ui
```

## License

Private
