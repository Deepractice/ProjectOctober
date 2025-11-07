# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

Alwayse response user in Chinese。


## Project Overview

**Deepractice Agent** is a visual AI agent interface that provides Claude capabilities through a web UI. It's a full-stack desktop-class application packaged as a Docker container, following "separated development, unified deployment" architecture.

**Key Characteristics**:

- Monorepo using pnpm workspaces + Turbo
- Full-stack application (apps/agent) with React frontend + Node.js backend + CLI
- Single port deployment (5200) with embedded frontend
- Published as npm package: `@deepractice-ai/agent`
- Integrates with @anthropic-ai/sdk

## Commands

### Development

```bash
# Start full development environment (Vite + server)
pnpm dev

# Start only frontend (port 5173)
cd apps/agent && pnpm dev:web

# Start only server (port 5200)
cd apps/agent && pnpm dev:server

# Clean port and restart (if port 5200 is occupied)
cd apps/agent && pnpm dev:clean
```

**Access**: http://localhost:5173 (development with HMR)

### Build & Quality

```bash
# Build all packages in dependency order
pnpm build

# Lint all packages
pnpm lint

# Type check all packages
pnpm typecheck

# Format with Prettier
pnpm format

# Run tests (BDD + Unit)
pnpm test

# Clean all build outputs and node_modules
pnpm clean
```

### Testing

```bash
# Run tests in watch mode
pnpm --filter @deepractice-ai/agent test:watch

# Run package-specific tests
pnpm --filter <package-name> test
```

### Package-Specific Commands

```bash
# Rebuild agent only
pnpm --filter @deepractice-ai/agent build

# Rebuild agent-sdk only
pnpm --filter @deepractice-ai/agent-sdk build
```

## Architecture

### Frontend State Management Architecture

**Principle**: Component → Store → EventBus

Agent's frontend follows a strict unidirectional data flow pattern using Zustand stores and a centralized EventBus.

**Architecture Rules**:

1. ✅ **Components ONLY call Store actions** - Never directly emit or subscribe to EventBus
2. ✅ **Stores handle ALL EventBus interactions** - Both emitting and subscribing to events
3. ✅ **Business logic lives in Store event handlers** - Not in components
4. ✅ **Components subscribe to Store state** - Using Zustand hooks

**Data Flow**:

```
User Action
  ↓
Component calls Store action (e.g., selectSession(id))
  ↓
Store emits EventBus event (e.g., session.selected)
  ↓
Store's EventBus listener handles event (business logic)
  ↓
Store updates internal state
  ↓
Component re-renders (via Zustand subscription)
```

**Example - Correct Pattern**:

```typescript
// ❌ WRONG - Component subscribing to EventBus
function MyComponent() {
  useEffect(() => {
    eventBus.on(...).subscribe((event) => { ... })  // NEVER DO THIS
  }, [])
}

// ✅ CORRECT - Component calls Store action
function MyComponent() {
  const selectSession = useSessionStore(state => state.selectSession)

  const handleClick = () => {
    selectSession(sessionId)  // Call Store action
  }
}

// ✅ CORRECT - Store handles EventBus
// In sessionStore.ts
selectSession: (sessionId: string) => {
  eventBus.emit({ type: "session.selected", sessionId })
}

eventBus.on(isSessionEvent).subscribe(async (event) => {
  if (event.type === "session.selected") {
    // Handle business logic here
    store.setSelectedSession(session)
  }
})
```

**Key Benefits**:

- Clear separation of concerns
- Testable business logic (in Stores)
- Predictable state updates
- Easy to debug (centralized event flow)

### Monorepo Structure

```
Agent/
├── apps/
│   └── agent/                  # Full-stack application
│       ├── web/                # React frontend (Vite + TypeScript)
│       ├── server/             # Node.js backend (Express + WebSocket)
│       ├── cli/                # CLI tool (Commander.js)
│       └── dist/               # Build output (web/, server/, cli/)
└── packages/
    └── agent-sdk/              # Claude SDK wrapper
```

### Application Structure (apps/agent)

The main application follows this structure:

```
apps/agent/
├── web/               # Frontend source
│   ├── src/           # React components, stores, types
│   └── vite.config.ts # Vite configuration
├── server/            # Backend source
│   ├── routes/        # API endpoints
│   ├── websocket/     # WebSocket handlers
│   └── core/          # Agent integration, config
├── cli/               # CLI source
│   └── index.ts       # Commander.js CLI
└── dist/              # Build output
    ├── web/           # Frontend static files
    ├── server/        # Server bundle
    └── cli/           # CLI binary
```

**Key Principle**: All three parts (web, server, CLI) are bundled together and published as one npm package.

### Development vs Production

**Development** (2 processes):

- Vite dev server on 5173 (HMR, proxies /api/\* to 5200)
- Agent server on 5200 (API + WebSocket)

**Production** (1 process):

- Agent server on 5200 serves everything:
  - Static frontend from `dist/web/`
  - API at `/api/*`
  - WebSocket at `/ws`, `/shell`
  - CLI available as `agentx` command

### Port Allocation

- **5200**: Agent server (unified entry point, always)
- **5173**: Vite dev server (development only, default)
- **5203**: Reserved for PromptX MCP server (future)

## Environment Configuration

### Setup

```bash
# Copy and edit local config (gitignored)
cp env/.env.example env/.env.local
nano env/.env.local  # Add ANTHROPIC_API_KEY
```

### Loading Priority

1. `env/.env.[NODE_ENV]` (development/test/production)
2. `env/.env.local` (your secrets, highest priority)

### Required Variables

- `ANTHROPIC_API_KEY` - Claude API key (required)

### Optional Variables

- `PORT=5200` - Agent service port
- `ANTHROPIC_BASE_URL=https://api.anthropic.com` - API endpoint
- `PROJECT_PATH=.` - Default project directory
- `NODE_ENV=development` - Environment mode

See `env/.env.example` for full list.

## Testing Strategy

**Philosophy**: BDD (80%) for behavior + Unit tests (20%) for edge cases

### BDD with Cucumber

- Test user-facing behavior (API methods, HTTP endpoints, workflows)
- Feature files in `features/` directory
- Step definitions in `tests/steps/`
- Use `@deepracticex/vitest-cucumber` plugin

**Example**: `packages/agent-config/features/api/get-config.feature`

### Unit Tests

- Test algorithms, edge cases, error handling
- Co-locate with source: `src/core/parser.ts` → `src/core/parser.test.ts`
- Use standard Vitest API

### Coverage Targets

- Overall: 70-80% (quality over quantity)
- BDD: 60-70% (happy paths + critical failures)
- Unit: 80-90% (thorough edge cases)

## Code Style & Conventions

### Language

- **Code, comments, logs, errors**: Always English
- **Documentation**: English (except Unicorn and AaaS projects)

### Naming

- One file, one type (OOP style)
- Interface-first naming: `ConfigLoader` not `EnvConfigLoader`
- No Hungarian notation
- Use descriptive names for clarity

### Import Aliases

- `~/*` - Internal package imports
- `@/*` - External package imports

Example:

```typescript
import { getConfig } from "~/api/getConfig"; // Internal
import { createLogger } from "@deepracticex/logger"; // External
```

## Development Workflow

### Making Changes

1. **Start development**: `pnpm dev`
2. **Make changes**: Files auto-reload (Vite HMR for frontend)
3. **Backend changes**: Restart `pnpm dev:service` if needed
4. **Run tests**: `pnpm test` or `pnpm --filter <package> test`
5. **Build**: `pnpm build` (validates all packages)

### Adding Config Variables

1. Update config loading: `apps/agent/server/core/config.ts`
2. Update templates: `env/.env.example`, `env/.env.development`, etc.
3. Test: Run server in dev mode to verify

### Creating Changesets

Before submitting PRs, generate changeset file:

```bash
# Do NOT use interactive CLI (use direct file creation)
# Create file directly in .changeset/ directory
# Example: .changeset/fix-config-loading.md
```

**Changeset format**:

```yaml
---
"@deepractice-ai/agent": patch
---
Fix configuration loading issue
```

## Architecture Decisions

### Why Monorepo?

- Shared TypeScript types
- Unified dependency management
- Atomic commits across full stack
- Easier refactoring

### Why Single Package Architecture?

- Simpler deployment (one npm package, one Docker image)
- Better user experience (install once, get everything)
- Easier dependency management
- Reduces monorepo overhead

### Why Server Serves Static Files?

- Simplifies deployment (single container)
- Reduces infrastructure complexity
- Better for desktop-class applications
- WebSocket connections share same origin

### Why Separate Development Servers?

- Fast HMR in frontend (Vite)
- Server can reload independently
- Clear separation of concerns
- Better debugging experience

## Common Issues

### Port Already in Use

```bash
# Kill process on port 5200
lsof -ti:5200 | xargs kill -9

# Or use dev:clean script
cd apps/agent && pnpm dev:clean
```

### Build Cache Issues

```bash
pnpm clean
pnpm build
```

### Changes to agent-sdk Not Reflected

```bash
# Rebuild the SDK package
pnpm --filter @deepractice-ai/agent-sdk build

# Or rebuild everything
pnpm build
```

### Cannot Find Module Error

The package hasn't been built yet:

```bash
pnpm build
```

## Related Documentation

- [Architecture Overview](docs/ARCHITECTURE.md) - Detailed system design
- [Commands Reference](docs/commands.md) - Complete command documentation
- [Configuration Guide](docs/configuration.md) - Config system details
- [Testing Strategy](docs/testing-strategy.md) - BDD + Unit testing approach
- [Environment Variables](env/README.md) - Env file management
