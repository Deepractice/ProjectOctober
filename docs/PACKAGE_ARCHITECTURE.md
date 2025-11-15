# Package Architecture

> **Architecture Governance through Physical Separation**
>
> This document explains the package architecture of the Agent ecosystem. The separation of packages is not for bundle size optimization, but for **enforcing architectural constraints** through physical boundaries.

## Architecture Philosophy

### Core Principle

```
Physical Separation > Code Conventions
```

By splitting packages, we make architectural violations **impossible** rather than **forbidden**. If `agentx-api` tries to import from `agentx-core`, the build will fail because `agentx-core` is not in its dependencies.

### Design Goals

1. **Standard Layer Stability** - API/Types/Events are industry-standard contracts that rarely change
2. **Implementation Freedom** - Core/SDK can iterate rapidly without breaking the standard
3. **Multiple Implementations** - Community can build alternative implementations (e.g., agentx-core-lite, agentx-core-rust)
4. **Prevent Abstraction Leakage** - Implementation details cannot leak into interface definitions

---

## Package Layers

```
┌─────────────────────────────────────────────────────────┐
│                  STANDARD LAYER                          │
│  (Strict version control, RFC process for changes)      │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ agentx-  │  │ agentx-  │  │ agentx-  │             │
│  │  types   │  │  events  │  │   api    │             │
│  │          │  │          │  │          │             │
│  │ Pure TS  │  │ Event    │  │Interface │             │
│  │ types    │  │ protocol │  │contracts │             │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘             │
│       │             │             │                     │
└───────┼─────────────┼─────────────┼─────────────────────┘
        │             │             │
        └─────────────┴─────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│               IMPLEMENTATION LAYER                       │
│  (Rapid iteration, backward compatible with standard)   │
│                                                          │
│            ┌─────────────────┐                          │
│            │  agentx-core    │                          │
│            │                 │                          │
│            │ Platform-agnostic business logic           │
│            │ Pure algorithms, state machines            │
│            │ No Node.js/Browser specific code           │
│            └────────┬────────┘                          │
│                     │                                   │
└─────────────────────┼───────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│                 RUNTIME LAYER                            │
│  (Platform-specific adaptations)                        │
│                                                          │
│     ┌─────────────────┐      ┌──────────────────┐      │
│     │ agent-sdk       │      │ agent-sdk-lite   │      │
│     │ (Node.js)       │      │ (Browser)        │      │
│     │                 │      │                  │      │
│     │ Core +          │      │ Core +           │      │
│     │ WebSocket       │      │ WebSocket        │      │
│     │ SQLite          │      │ Memory           │      │
│     │ Node.js APIs    │      │ Browser APIs     │      │
│     └─────────────────┘      └──────────────────┘      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Package Details

### 📦 agentx-types

**Purpose**: Pure TypeScript type definitions (What things _are_)

**Contents**:

- LLM types (LLMConfig, LLMRequest, LLMResponse, TokenUsage)
- Message types (UserMessage, AssistantMessage, ContentPart)
- Session types (Session, SessionMetadata)
- Agent types (AgentMetadata)
- MCP types (McpTool, McpResource, McpPrompt)

**Characteristics**:

- ✅ Zero dependencies
- ✅ Pure types, no implementations
- ✅ No runtime code
- ✅ Domain-driven organization

**Version Strategy**: Stable (v1.x can last for years)

**Example**:

```typescript
import type { Message, UserMessage, LLMConfig } from "@deepractice-ai/agentx-types";

const config: LLMConfig = {
  provider: "anthropic",
  model: "claude-3-5-sonnet-20241022",
  maxTokens: 4096,
};
```

---

### 📦 agentx-events

**Purpose**: Event protocol definitions (What _happens_)

**Contents**:

- Agent state events (idle, thinking, speaking, tool_calling)
- Message events (user, assistant)
- Stream events (start, chunk, end)
- Session lifecycle events (created, active, completed)
- Tool events (start, success, error)
- Persistence events (save, load operations)
- Statistics events (token usage, cost updates)

**Characteristics**:

- ✅ Depends only on agentx-types
- ✅ Type-safe event payloads
- ✅ Event naming convention: `<domain>:<action>`
- ✅ 31+ event types

**Version Strategy**: Stable (v1.x, synchronized with types)

**Example**:

```typescript
import type { AgentStateEvents, EventPayload } from "@deepractice-ai/agentx-events";

// Type-safe event handling
type ThinkingPayload = EventPayload<"agent:thinking">;
// → { timestamp: number }
```

---

### 📦 agentx-api

**Purpose**: API interface contracts (How to use)

**Contents**:

- Agent interface (generate, stream, fork, clear)
- AgentFactory interface (createAgent, resumeAgent)
- GenerateResult, StreamResult types
- Options types (GenerateOptions, StreamOptions)

**Characteristics**:

- ✅ Depends only on agentx-types
- ✅ Pure interfaces, no implementations
- ✅ Promise-based async API
- ✅ Streaming support via AsyncIterable

**Version Strategy**: Stable (v1.x, breaking changes are rare)

**Example**:

```typescript
import type { Agent, GenerateOptions } from "@deepractice-ai/agentx-api";

// Interface for all Agent implementations
interface Agent {
  generate(message: string, options?: GenerateOptions): Promise<GenerateResult>;
  stream(message: string, options?: StreamOptions): Promise<StreamResult>;
  fork(fromMessageId?: string): Promise<Agent>;
}
```

---

### 📦 agentx-core

**Purpose**: Platform-agnostic business logic implementation

**Contents**:

- **core/** - Core implementations
  - AgentCore (implements Agent interface)
  - SessionManager
  - BaseSession
  - State machines (AgentStateMachine, SessionStateMachine)
  - MessageStream
- **adapters/** - LLM adapters
  - ClaudeAdapter (Anthropic Claude)
  - Abstract adapter interfaces
- **persistence/** - Persistence implementations
  - MemoryPersister (in-memory, platform-agnostic)
  - SQLiteAgentPersister (requires Node.js, but abstracted)
- **facade/** - Assembly layer
  - createAgent() factory
  - Dependency injection setup
- **errors/** - Error types
  - AgentError hierarchy

**Characteristics**:

- ✅ Implements agentx-api interfaces
- ✅ Platform-agnostic algorithms
- ✅ No direct Node.js/Browser API calls in core logic
- ✅ Uses dependency injection for platform-specific parts

**Dependencies**:

```json
{
  "@deepractice-ai/agentx-types": "workspace:*",
  "@deepractice-ai/agentx-events": "workspace:*",
  "@deepractice-ai/agentx-api": "workspace:*",
  "@anthropic-ai/sdk": "^0.32.1",
  "rxjs": "^7.8.1",
  "eventemitter3": "^5.0.1",
  "neverthrow": "^8.2.0",
  "xstate": "^5.24.0"
}
```

**Version Strategy**: Rapid iteration (v0.x → v1.0 → v2.0)

**Example**:

```typescript
import { AgentCore } from "@deepractice-ai/agentx-core";
import type { Agent } from "@deepractice-ai/agentx-api";

// AgentCore implements the Agent interface
class AgentCore implements Agent {
  async generate(message: string, options?: GenerateOptions): Promise<GenerateResult> {
    // Platform-agnostic implementation
  }
}
```

---

### 📦 agent-sdk (Node.js)

**Purpose**: agentx-core + Node.js runtime adaptations

**Contents**:

- **server/** - Node.js specific features
  - WebSocketServer (using 'ws' package)
  - WebSocketBridge
  - SQLite persistence bindings
- **facade/** - Node.js assembly
  - createAgent() (wraps agentx-core with Node.js deps)
  - createWebSocketServer()

**Characteristics**:

- ✅ Re-exports everything from agentx-core
- ✅ Adds Node.js specific features
- ✅ Main entry point for Node.js users

**Dependencies**:

```json
{
  "@deepractice-ai/agentx-core": "workspace:*",
  "ws": "^8.0.0",
  "better-sqlite3": "^12.4.1"
}
```

**Version Strategy**: Follows agentx-core version

**Example**:

```typescript
// Users only install agent-sdk
import { createAgent, createWebSocketServer } from "@deepractice-ai/agent-sdk";

const agent = createAgent({
  workspace: "./data",
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const wsServer = createWebSocketServer({ port: 5200 });
```

---

### 📦 agent-sdk-lite (Browser) - Future

**Purpose**: agentx-core + Browser runtime adaptations

**Contents**:

- **browser/** - Browser specific features
  - WebSocket Bridge (using browser WebSocket API)
  - IndexedDB persistence
  - Virtual sessions (no disk I/O)

**Dependencies**:

```json
{
  "@deepractice-ai/agentx-core": "workspace:*"
  // No Node.js dependencies
}
```

**Example**:

```typescript
import { createBrowserAgent } from "@deepractice-ai/agent-sdk-lite";

const agent = createBrowserAgent({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  storage: "indexeddb",
});
```

---

## Dependency Graph

```
agentx-types (0 deps)
    ↓
agentx-events (deps: agentx-types)
agentx-api (deps: agentx-types)
    ↓
agentx-core (deps: types + events + api + @anthropic-ai/sdk)
    ↓
agent-sdk (deps: agentx-core + ws + better-sqlite3)
agent-sdk-lite (deps: agentx-core)
```

### Dependency Rules

1. **Standard packages (types/events/api) NEVER depend on implementation packages (core/sdk)**
2. **One-way dependency flow**: types ← events/api ← core ← sdk
3. **No circular dependencies**: Enforced by pnpm workspace
4. **Platform dependencies only in SDK layer**: Core remains platform-agnostic

---

## Key Concepts

### Platform-Agnostic (agentx-core)

**What it means**:

- Pure business logic and algorithms
- No `process`, `fs`, `window`, `document` usage in core logic
- Platform-specific code abstracted behind interfaces

**Example**:

```typescript
// ✅ Platform-agnostic (in agentx-core)
class AgentCore {
  constructor(
    private adapter: LLMAdapter,      // Abstracted
    private persister: Persister,     // Abstracted
    private logger: Logger            // Abstracted
  ) {}

  async generate(message: string): Promise<GenerateResult> {
    // Pure logic, no platform APIs
    const response = await this.adapter.complete(request);
    await this.persister.save(session);
    return result;
  }
}

// ❌ Platform-specific (should be in agent-sdk)
class AgentCore {
  async generate(message: string) {
    const db = new Database('./data.db');  // ❌ Direct Node.js usage
    const response = await fetch(...);      // ❌ Browser/Node.js specific
  }
}
```

### Platform-Specific (agent-sdk)

**What it means**:

- Injects platform-specific implementations
- Handles platform APIs (WebSocket, FileSystem, Database)
- Wraps agentx-core with concrete dependencies

**Example**:

```typescript
// agent-sdk/src/facade/agent.ts
import { AgentCore } from "@deepractice-ai/agentx-core";
import { WebSocketServer } from "ws"; // Node.js specific
import Database from "better-sqlite3"; // Node.js specific

export function createAgent(config: AgentConfig): Agent {
  // Inject Node.js specific implementations
  const persister = new SQLiteAgentPersister(new Database(config.dbPath));
  const wsServer = new WebSocketServer({ port: config.port });

  return new AgentCore(
    adapter,
    persister, // ← Platform-specific injected
    wsServer, // ← Platform-specific injected
    logger
  );
}
```

---

## Version Strategy

### Standard Layer (types/events/api)

**Versioning**: Semantic Versioning with strict adherence

- **Major (1.0 → 2.0)**: Breaking changes (rare, requires RFC)
- **Minor (1.0 → 1.1)**: New types/events/interfaces (requires review)
- **Patch (1.0.0 → 1.0.1)**: Documentation fixes only

**Change Process**:

1. Propose change via RFC (Request for Comments)
2. Team review and approval
3. Update version
4. Publish with detailed changelog

**Goal**: v1.0 should last for years

### Implementation Layer (core/sdk)

**Versioning**: Standard Semantic Versioning

- **Major**: Architecture changes
- **Minor**: New features (frequent)
- **Patch**: Bug fixes (frequent)

**Change Process**: Standard PR review

**Goal**: Rapid iteration while maintaining standard compatibility

---

## Architecture Enforcement (Future)

### 1. CI/CD Checks

```yaml
# .github/workflows/architecture-check.yml
- name: Validate agentx-types has zero dependencies
  run: |
    DEPS=$(jq '.dependencies // {} | length' packages/agentx-types/package.json)
    if [ "$DEPS" -ne 0 ]; then
      echo "❌ agentx-types must have zero dependencies!"
      exit 1
    fi

- name: Validate agentx-api doesn't depend on agentx-core
  run: |
    if grep -q "agentx-core" packages/agentx-api/package.json; then
      echo "❌ agentx-api cannot depend on agentx-core!"
      exit 1
    fi
```

### 2. ESLint Rules

```javascript
// packages/agentx-types/.eslintrc.js
module.exports = {
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: ["@deepractice-ai/agentx-core", "@deepractice-ai/agent-sdk", "@anthropic-ai/*"],
      },
    ],
  },
};
```

### 3. Package Metadata

```json
// packages/agentx-types/package.json
{
  "name": "@deepractice-ai/agentx-types",
  "version": "1.0.0",
  "agentx": {
    "layer": "standard",
    "allowedDependencies": []
  }
}
```

---

## Comparison with Industry Standards

### Similar Architectures

| Standard          | Implementation             | Purpose                      |
| ----------------- | -------------------------- | ---------------------------- |
| `javax.servlet.*` | `org.apache.tomcat.*`      | Prevent vendor lock-in       |
| `POSIX`           | `Linux`, `macOS`           | OS interoperability          |
| `OpenAPI Spec`    | `swagger-codegen`          | API standardization          |
| `DOM API`         | `Blink`, `Gecko`, `WebKit` | Browser compatibility        |
| **agentx-api**    | **agentx-core**            | **AI Agent standardization** |

### Our Position

We follow the **Java EE / POSIX model**:

- **Standard layer** (types/events/api) = Industry contract
- **Implementation layer** (core) = Reference implementation
- **Runtime layer** (sdk) = Platform-specific distribution

---

## Migration Guide (Current → Target)

### Current State (agent-sdk)

```
packages/agent-sdk/
├── src/
│   ├── types/        # Will move to agentx-types ✗
│   ├── api/          # Will move to agentx-api ✗
│   ├── core/         # Will move to agentx-core ✓
│   ├── adapters/     # Will move to agentx-core ✓
│   ├── persistence/  # Will move to agentx-core ✓
│   └── facade/       # Will split between core and sdk
```

### Target State

```
packages/agentx-types/    (new, extracted from agent-sdk/src/types)
packages/agentx-events/   (new, extracted from agent-sdk/src/types/events)
packages/agentx-api/      (new, extracted from agent-sdk/src/api)
packages/agentx-core/     (new, agent-sdk/src/core + adapters + persistence)
packages/agent-sdk/       (refactored, Node.js specific + re-exports core)
```

### Migration Steps

1. ✅ Create agentx-types package
2. ✅ Create agentx-events package
3. ✅ Create agentx-api package
4. ⏳ Create agentx-core package
5. ⏳ Refactor agent-sdk to depend on agentx-core
6. ⏳ Update import paths across codebase
7. ⏳ Add architecture enforcement (CI/CD, ESLint)

---

## Benefits

### 1. Architectural Integrity

**Problem**: Without separation, implementation can leak into interfaces

```typescript
// ❌ Bad (mixed in one package)
// types/Agent.ts
import { AgentCore } from "../core/AgentCore";
export interface Agent extends AgentCore {} // Abstraction broken!

// ✅ Good (separate packages)
// agentx-api/src/Agent.ts
import { AgentCore } from "@deepractice-ai/agentx-core";
// ❌ Error: agentx-core not in dependencies!
```

### 2. Multiple Implementations

Community can build alternative implementations:

- `agentx-core-lite` - Minimal implementation
- `agentx-core-rust` - Rust implementation via WASM
- `agentx-core-cloud` - Cloud API-based implementation

All must implement `agentx-api` interfaces → Guaranteed compatibility

### 3. Independent Versioning

```
agentx-api v1.0.0 (stable, 2025-2027)
    ↓
agentx-core v0.8.5 (rapid iteration)
agentx-core v1.0.0 (major refactor)
agentx-core v2.0.0 (new architecture)
    ↓
All implementations must still satisfy agentx-api v1.0.0
```

### 4. Bundle Size Optimization (Secondary Benefit)

Frontend projects that only need types:

```json
{
  "devDependencies": {
    "@deepractice-ai/agentx-types": "^1.0.0" // ~50KB
    // No need for agentx-core (~300KB) or agent-sdk (~500KB)
  }
}
```

---

## FAQ

### Q: Why not merge types/events/api into one package?

**A**: Different volatility levels

- `types` - Rarely changes (data structures)
- `events` - Medium changes (new event types)
- `api` - Most stable (interface contracts)

Separate packages allow independent versioning.

### Q: Can I use agentx-core directly without agent-sdk?

**A**: Yes, if you provide platform implementations yourself

```typescript
import { AgentCore } from "@deepractice-ai/agentx-core";

// You must inject platform-specific dependencies
const agent = new AgentCore(myCustomAdapter, myCustomPersister, myCustomLogger);
```

### Q: What if I want a lightweight browser version?

**A**: Use `agent-sdk-lite` (future)

```typescript
import { createBrowserAgent } from "@deepractice-ai/agent-sdk-lite";
// No Node.js dependencies, smaller bundle
```

### Q: How do I know which package to install?

**A**: Decision tree

```
Need types only (TypeScript project)?
  → @deepractice-ai/agentx-types

Building custom implementation?
  → @deepractice-ai/agentx-api (interface)
  → @deepractice-ai/agentx-core (reference)

Using Agent in Node.js?
  → @deepractice-ai/agent-sdk

Using Agent in Browser?
  → @deepractice-ai/agent-sdk-lite (future)
```

---

## References

### Industry Standards

- [Java EE Specifications](https://jakarta.ee/specifications/)
- [POSIX Standards](https://pubs.opengroup.org/onlinepubs/9699919799/)
- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
- [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Architectural-Overview)

### Internal Documents

- [Testing Strategy](./testing-strategy.md)
- [Configuration Guide](./configuration.md)
- [Architecture Overview](./ARCHITECTURE.md)

---

**Last Updated**: 2025-11-14
**Maintainers**: Deepractice AI Team
**Status**: Draft (RFC in progress)
