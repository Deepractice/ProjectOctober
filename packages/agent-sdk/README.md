# @deepractice-ai/agent-sdk

High-performance Agent SDK with RxJS event-driven architecture for building AI agents powered by Claude.

## Features

- 🚀 **Event-Driven Architecture** - Built on RxJS for reactive programming
- 💬 **Multi-Session Management** - Handle multiple concurrent conversations
- 🖼️ **Multi-Modal Support** - Text and image content blocks
- 💾 **Persistent Storage** - SQLite-based session and message persistence
- 🔌 **Extensible Design** - Custom adapters for different AI providers
- 🔄 **Real-Time Streaming** - Stream AI responses chunk by chunk
- 🎯 **Type-Safe** - Full TypeScript support with comprehensive types
- ⚡ **Result Type Pattern** - Safe error handling with neverthrow

## Installation

```bash
npm install @deepractice-ai/agent-sdk
# or
pnpm add @deepractice-ai/agent-sdk
# or
yarn add @deepractice-ai/agent-sdk
```

## Quick Start

### Basic Usage

```typescript
import { createAgent } from "@deepractice-ai/agent-sdk";

// Create an agent (throws on error)
const agent = createAgent({
  workspace: "/path/to/project",
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Initialize the agent
await agent.initialize();

// Quick chat (creates session automatically)
const session = await agent.chat("Hello, Claude!");

// Get all messages
const messages = session.getMessages();
console.log(messages);
```

### Safe Mode (Result Type)

```typescript
import { createAgent } from "@deepractice-ai/agent-sdk";

// Create an agent with safe mode (returns Result)
const result = createAgent(
  {
    workspace: "/path/to/project",
    apiKey: process.env.ANTHROPIC_API_KEY!,
  },
  { safe: true }
);

if (result.isErr()) {
  console.error("Failed to create agent:", result.error);
  process.exit(1);
}

const agent = result.value;
await agent.initialize();
```

### Working with Sessions

```typescript
// Create a session manually
const session = await agent.createSession({
  model: "claude-sonnet-4",
  summary: "Code review session",
});

// Send messages
await session.send("Can you review this code?");
await session.send("What are the potential issues?");

// Get session messages
const messages = session.getMessages();

// Complete the session when done
await session.complete();
```

### Multi-Modal Messages

```typescript
import { ImageBlock, TextBlock } from "@deepractice-ai/agent-sdk";

// Send text with image
const imageBlock: ImageBlock = {
  type: "image",
  source: {
    type: "base64",
    media_type: "image/png",
    data: base64ImageData,
  },
};

const textBlock: TextBlock = {
  type: "text",
  text: "What is in this image?",
};

await session.send([textBlock, imageBlock]);
```

### Event-Driven API

```typescript
// Listen to session events
session.on("agent:thinking", () => {
  console.log("AI is thinking...");
});

session.on("agent:speaking", ({ chunk }) => {
  console.log("Chunk:", chunk);
});

session.on("stream:end", ({ totalChunks }) => {
  console.log(`Received ${totalChunks} chunks`);
});

session.on("message:agent", ({ message }) => {
  console.log("AI response:", message.content);
});

// Send a message
await session.send("Explain quantum computing");
```

### Observable Streams (RxJS)

```typescript
import { filter, map } from "rxjs/operators";

// Subscribe to message stream
session
  .messages$()
  .pipe(
    filter((msg) => msg.type === "agent"),
    map((msg) => msg.content)
  )
  .subscribe((content) => {
    console.log("AI:", content);
  });

// Subscribe to all agent events
agent
  .sessions$()
  .pipe(filter((event) => event.type === "session:created"))
  .subscribe((event) => {
    console.log("New session:", event.sessionId);
  });
```

## API Reference

### Agent

#### `createAgent(config, options?)`

Create a new Agent instance.

**Parameters:**

- `config: AgentConfig` - Agent configuration
  - `workspace: string` - Project workspace path
  - `apiKey: string` - Anthropic API key (required)
  - `baseUrl?: string` - Custom API endpoint
  - `model?: string` - Default model (e.g., 'claude-sonnet-4')
  - `mcpServers?: Record<string, McpServerConfig>` - MCP server configurations
  - `logger?: LoggerConfig` - Logger configuration

- `options?: AgentDependencies & { safe?: boolean }` - Optional creation options
  - `safe?: boolean` - If true, returns `Result<Agent, AgentError>`; otherwise returns `Agent` (throws on error)
  - `adapter?: AgentAdapter` - Custom AI adapter
  - `persister?: AgentPersister` - Custom storage persister
  - `logger?: Logger` - Custom logger

**Returns:**

- When `safe: true`: `Result<Agent, AgentError>` - Ok with Agent or Err with typed error
- When `safe: false` or omitted: `Agent` - Agent instance (throws `AgentError` on failure)

#### Agent Methods

```typescript
interface Agent {
  // Lifecycle
  initialize(): Promise<void>;
  destroy(): void;

  // Session management
  createSession(options: SessionCreateOptions): Promise<Session>;
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
interface Session extends EventEmitter<SessionEvents> {
  readonly id: string;
  readonly createdAt: Date;
  readonly state: SessionState;

  // Actions
  send(content: string | ContentBlock[]): Promise<void>;
  abort(): Promise<void>;
  complete(): Promise<void>;
  delete(): Promise<void>;

  // Observables
  messages$(): Observable<AnyMessage>;

  // Queries
  getMessages(limit?: number, offset?: number): AnyMessage[];
  getTokenUsage(): TokenUsage;
  getMetadata(): SessionMetadata;
  summary(): string;

  // Utilities
  isActive(): boolean;
  isCompleted(): boolean;
}
```

#### Session States

- `created` - Session created but no messages yet
- `active` - Actively processing a message
- `idle` - Waiting for next message
- `completed` - Session finished normally
- `error` - Session encountered an error
- `aborted` - Session aborted by user
- `deleted` - Session deleted

### Events

#### Session Events

**Agent State Events:**

- `agent:idle` - AI is idle
- `agent:thinking` - AI is processing
- `agent:speaking` - AI is generating response
- `agent:tool_calling` - AI is calling a tool
- `agent:tool_waiting` - Waiting for tool result
- `agent:error` - An error occurred
- `agent:completed` - AI completed the task

**Message Events:**

- `message:user` - User message received
- `message:agent` - Agent message received

**Stream Events:**

- `stream:start` - Stream started
- `stream:chunk` - Received a chunk
- `stream:end` - Stream ended

**Session Lifecycle Events:**

- `session:created` - Session created
- `session:active` - Session became active
- `session:idle` - Session became idle
- `session:completed` - Session completed
- `session:error` - Session error
- `session:deleted` - Session deleted

**Persistence Events:**

- `persist:message:start` - Message persistence started
- `persist:message:success` - Message persisted successfully
- `persist:message:error` - Message persistence failed
- `persist:session:start` - Session persistence started
- `persist:session:success` - Session persisted successfully
- `persist:session:error` - Session persistence failed

### Types

```typescript
// Message types
type MessageType = "user" | "agent";

interface UserMessage {
  id: string;
  type: "user";
  content: string | ContentBlock[];
  timestamp: Date;
}

interface AgentMessage {
  id: string;
  type: "agent";
  content: string;
  timestamp: Date;
  usage?: TokenUsageRaw;
}

type AnyMessage = UserMessage | AgentMessage;

// Content blocks
type ContentBlock = TextBlock | ImageBlock;

interface TextBlock {
  type: "text";
  text: string;
}

interface ImageBlock {
  type: "image";
  source: {
    type: "base64";
    media_type: "image/png" | "image/jpeg" | "image/gif" | "image/webp";
    data: string;
  };
}

// Token usage
interface TokenUsage {
  used: number;
  total: number;
  breakdown: {
    input: number;
    output: number;
    cacheRead: number;
    cacheCreation: number;
  };
}
```

## Advanced Usage

### Custom Adapter (Different AI Provider)

```typescript
import { createAgent, AgentAdapter } from "@deepractice-ai/agent-sdk";

class CustomAdapter implements AgentAdapter {
  // Implement adapter interface
  // ...
}

const result = createAgent(
  {
    workspace: "/path/to/project",
    apiKey: "your-api-key",
  },
  {
    adapter: new CustomAdapter(),
  }
);
```

### Custom Persister (Different Storage)

```typescript
import { createAgent, AgentPersister } from "@deepractice-ai/agent-sdk";

class RedisAgentPersister implements AgentPersister {
  // Implement persister interface
  // ...
}

const result = createAgent(
  {
    workspace: "/path/to/project",
    apiKey: process.env.ANTHROPIC_API_KEY!,
  },
  {
    persister: new RedisAgentPersister(),
  }
);
```

### Error Handling

```typescript
import { createAgent, AgentError } from "@deepractice-ai/agent-sdk";

// Default mode: throws on error (simple)
try {
  const agent = createAgent({
    workspace: "/tmp",
    apiKey: "invalid-key",
  });
  await agent.initialize();
} catch (error) {
  if (error instanceof AgentError) {
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
  }
}

// Safe mode: returns Result type (for advanced error handling)
const result = createAgent({ workspace: "/tmp", apiKey: "test" }, { safe: true });

// Pattern 1: Check with isOk/isErr
if (result.isOk()) {
  const agent = result.value;
  await agent.initialize();
} else {
  const error = result.error;
  console.error("Error code:", error.code);
  console.error("Error message:", error.message);
}

// Pattern 2: Match pattern
result.match(
  async (agent) => {
    // Success: use agent
    await agent.initialize();
  },
  (error) => {
    // Error: handle error
    console.error(error);
  }
);
```

### Session Management

```typescript
// Get all sessions
const sessions = agent.getSessions();

// Get specific session
const session = agent.getSession("session-id");

// Get token usage
const usage = session.getTokenUsage();
console.log(`Used: ${usage.used} / ${usage.total}`);
console.log(`Cache hit rate: ${usage.breakdown.cacheRead / usage.used}`);

// Get session metadata
const metadata = session.getMetadata();
console.log("Project:", metadata.projectPath);
console.log("Duration:", metadata.endTime - metadata.startTime);
```

### Agent Status Monitoring

```typescript
const status = agent.getStatus();

console.log("Ready:", status.ready);
console.log("Active sessions:", status.activeSessions);
console.log("Warmup pool size:", status.warmupPoolSize);
console.log("Metrics:", status.metrics);
// {
//   avgResponseTime: 1234,
//   totalSessions: 10,
//   cacheHitRate: 0.75
// }
```

## Environment-Specific Imports

The SDK provides different entry points for different environments:

### Common (Default)

Core SDK without environment dependencies, safe for all environments:

```typescript
import { createAgent } from "@deepractice-ai/agent-sdk";
// or
import { createAgent } from "@deepractice-ai/agent-sdk/common";
```

### Server (Node.js)

Server-side API with WebSocket server support:

```typescript
import {
  createAgent,
  createWebSocketServer,
  WebSocketBridge,
} from "@deepractice-ai/agent-sdk/server";
```

### Browser

Browser-side API with WebSocket bridge:

```typescript
import {
  createBrowserAgent,
  createBrowserSession,
  WebSocketBridge,
} from "@deepractice-ai/agent-sdk/browser";
```

## Examples

### Complete Example: Code Review Agent

```typescript
import { createAgent } from "@deepractice-ai/agent-sdk";

async function main() {
  // Create and initialize agent
  const agent = createAgent({
    workspace: process.cwd(),
    apiKey: process.env.ANTHROPIC_API_KEY!,
    model: "claude-sonnet-4",
  });

  await agent.initialize();

  // Create a code review session
  const session = await agent.createSession({
    summary: "Code review for PR #123",
  });

  // Setup event listeners
  session.on("agent:thinking", () => {
    console.log("🤔 Analyzing code...");
  });

  session.on("stream:chunk", ({ chunk }) => {
    process.stdout.write(chunk);
  });

  session.on("stream:end", () => {
    console.log("\n✅ Review complete");
  });

  // Send code for review
  await session.send(`
    Please review this TypeScript function:

    \`\`\`typescript
    function processData(data: any) {
      return data.map(x => x * 2);
    }
    \`\`\`
  `);

  // Ask follow-up questions
  await session.send("What type safety improvements would you suggest?");
  await session.send("Can you show me the refactored version?");

  // Complete the session
  await session.complete();

  // Print summary
  console.log("\nSession Summary:");
  console.log("Messages:", session.getMessages().length);
  console.log("Token usage:", session.getTokenUsage());

  // Cleanup
  agent.destroy();
}

main();
```

### Example: Real-time Chat with Streaming

```typescript
import { createAgent } from "@deepractice-ai/agent-sdk";

async function streamingChat() {
  const agent = createAgent({
    workspace: "/tmp/chat",
    apiKey: process.env.ANTHROPIC_API_KEY!,
  });

  await agent.initialize();

  const session = await agent.createSession();

  // Stream chunks to console
  let buffer = "";
  session.on("stream:chunk", ({ chunk, index }) => {
    buffer += chunk;
    process.stdout.write(chunk);
  });

  session.on("stream:end", ({ totalChunks }) => {
    console.log(`\n[Received ${totalChunks} chunks]`);
    buffer = "";
  });

  // Interactive chat
  const readline = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  readline.on("line", async (input: string) => {
    if (input === "exit") {
      await session.complete();
      agent.destroy();
      readline.close();
      return;
    }

    await session.send(input);
  });

  console.log('Chat started. Type "exit" to quit.\n');
}

streamingChat();
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit PRs to our [GitHub repository](https://github.com/Deepractice/Agent).

## Support

- 📖 [Documentation](https://github.com/Deepractice/Agent#readme)
- 🐛 [Issue Tracker](https://github.com/Deepractice/Agent/issues)
- 💬 [Discussions](https://github.com/Deepractice/Agent/discussions)
