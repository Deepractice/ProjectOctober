# Architecture Overview

## Core Philosophy

Agent is a **full-stack desktop-class application** packaged as a Docker container. It follows the principle of "separated development, unified deployment" - components are developed independently in a monorepo but deployed as a single unit.

## Project Structure

```
Agent/
├── apps/
│   └── agent/                  # Full-stack application (merged)
│       ├── web/                # React frontend source
│       │   ├── src/            # UI components, stores, types
│       │   ├── vite.config.ts  # Vite build configuration
│       │   └── index.html      # Entry HTML
│       ├── server/             # Node.js backend source
│       │   ├── routes/         # API endpoints
│       │   ├── websocket/      # WebSocket handlers
│       │   ├── core/           # Agent integration, config
│       │   ├── app.ts          # Express app configuration
│       │   └── index.ts        # Server entry point
│       ├── cli/                # CLI tool source
│       │   └── index.ts        # Commander.js CLI
│       ├── dist/               # Build output
│       │   ├── web/            # Frontend static files
│       │   ├── server/         # Server bundle
│       │   └── cli/            # CLI binary
│       └── package.json        # @deepractice-ai/agent
│
└── packages/
    └── agent-sdk/              # Claude SDK integration library
        └── dist/               # Build output
```

## Component Architecture

### apps/agent (Full-Stack Application)

**Role**: Unified application containing frontend, backend, and CLI

**Responsibilities**:

- **Server**: REST API endpoints (`/api/*`), WebSocket (`/ws`, `/shell`)
- **Frontend**: React UI with Zustand state management
- **CLI**: Command-line interface (`agentx` binary)
- Integrate with Claude Agent SDK
- Manage sessions, commands, and project state
- Serve static frontend files in production

**Ports**:

- Production: 5200 (unified)
- Development: 5173 (Vite) + 5200 (server)

**Key Files**:

**Server** (`server/`):

- `index.ts` - Server startup, configuration loading
- `app.ts` - Express app, route mounting, static file serving
- `core/agent.ts` - Claude Agent SDK integration
- `websocket/chat.ts` - Chat WebSocket handler
- `websocket/shell.ts` - Terminal WebSocket handler

**Frontend** (`web/`):

- `src/App.tsx` - Main application component
- `src/components/ChatInterface.tsx` - Chat UI
- `src/components/Terminal.tsx` - Terminal emulator
- `src/stores/sessionStore.ts` - Zustand state management

**CLI** (`cli/`):

- `index.ts` - Commander.js CLI with HTTP server command

**State Management Architecture**:

Agent-web follows a strict **Component → Store → EventBus** pattern:

```
Component (UI)
  ↓ calls action
Store (Zustand)
  ↓ emits event
EventBus (RxJS)
  ↓ broadcasts
Store (business logic)
  ↓ updates state
Component (re-renders)
```

**Rules**:

1. Components NEVER directly subscribe to EventBus
2. Components ONLY call Store actions
3. Stores handle ALL EventBus interactions
4. Business logic lives in Store event handlers

**Directory Structure**:

```
src/
├── components/        # React components (UI only)
├── stores/           # Zustand stores + EventBus subscriptions
│   ├── sessionStore.ts
│   ├── messageStore.ts
│   └── uiStore.ts
├── core/             # EventBus and adapters
│   ├── eventBus.ts
│   └── websocketAdapter.ts
├── api/              # Pure network requests
└── types/            # TypeScript types
```

### packages/agent-sdk (Shared Library)

**Role**: Claude Agent SDK wrapper and integration utilities

**Responsibilities**:

- Wrap @anthropic-ai/sdk for easier usage
- Provide session management utilities
- Shared types for Claude API integration

## Port Design

### Unified Port Strategy

```
Development:
  User → http://localhost:5173 (Vite dev server)
         ├─ /api/* → proxy to :5200 (agent server)
         ├─ /ws → proxy to :5200 (WebSocket)
         └─ /* → Vite HMR

Production (Docker/CLI):
  User → http://localhost:5200 (agent server)
         ├─ /api/* → handled by Express
         ├─ /ws → handled by WebSocket server
         └─ /* → static files from dist/web/
```

**Key Principle**: The agent server is always the source of truth on port 5200. In development, Vite runs alongside on 5173 for HMR, but all API/WebSocket traffic goes to the server.

## Data Flow

### HTTP Request Flow

```
Browser
  ↓ GET /api/sessions
apps/agent server (Express)
  ↓ read from SQLite
  ↓ return JSON
Browser
```

### WebSocket Flow (Chat)

```
Browser
  ↓ WebSocket connection to /ws
apps/agent server (WebSocket Server)
  ↓ authenticate & route
server/websocket/chat.ts
  ↓ create Claude Agent session
Claude SDK
  ↓ stream responses
Browser (real-time updates)
```

### WebSocket Flow (Terminal)

```
Browser
  ↓ WebSocket connection to /shell
apps/agent server (WebSocket Server)
  ↓ spawn PTY process
node-pty
  ↓ execute shell commands
File system / Project
```

## Development vs Production

### Development Environment

**Start Command**: `pnpm dev` (runs both frontend and server in parallel)

1. **Frontend (Vite)** starts on port 5173
   - Vite dev server with HMR
   - Proxies `/api/*`, `/ws`, `/shell` to :5200
   - Hot reload on file changes
   - Source: `apps/agent/web/`

2. **Server** starts on port 5200
   - Loads config from `.env`
   - Starts Express + WebSocket server
   - Does NOT serve static files (dev mode)
   - Source: `apps/agent/server/`

**Developer Access**: Open http://localhost:5173

### Production Environment (Docker/NPM)

**NPM Package**: `@deepractice-ai/agent` (published to npm)
**Docker Image**: `deepracticexs/agent:latest`

**Build Process**:

1. Build frontend → `apps/agent/dist/web/`
2. Build server → `apps/agent/dist/server/`
3. Build CLI → `apps/agent/dist/cli/bin.js`
4. Publish to npm as `@deepractice-ai/agent`
5. Docker image installs from npm: `npm install -g @deepractice-ai/agent`

**Runtime**:

- Single Node.js process running agent server
- Serves static files from `dist/web/`
- All requests go to port 5200
- CLI available as `agentx` command

**Usage**:

- Docker: `docker run -p 5200:5200 deepracticexs/agent`
- NPM: `npx @deepractice-ai/agent http`
- Global: `npm install -g @deepractice-ai/agent && agentx http`

## Technology Stack

### Frontend

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Styling
- **Zustand** - State management
- **CodeMirror** - Code editor
- **XTerm.js** - Terminal emulator
- **Marked** - Markdown rendering

### Backend

- **Node.js** - Runtime
- **Express** - HTTP server
- **ws** - WebSocket server
- **node-pty** - Terminal emulation
- **better-sqlite3** - Session storage
- **@anthropic-ai/sdk** - Claude API integration

### Shared

- **pnpm** - Package manager (workspace support)
- **Turbo** - Build orchestration
- **Zod** - Schema validation

## Configuration System

Agent uses environment-based configuration with .env files:

**Priority Order** (highest to lowest):

1. Runtime updates (in-memory)
2. Environment variables
3. `.env` file
4. Database/config file
5. Default values

**Key Config Values**:

- `PORT` - Server port (default: 5200)
- `ANTHROPIC_API_KEY` - Claude API key (required)
- `ANTHROPIC_BASE_URL` - API endpoint (default: https://api.anthropic.com)
- `PROJECT_PATH` - Working directory (default: current directory)
- `NODE_ENV` - Environment mode (development/production)

See [configuration.md](./configuration.md) for details.

## Deployment Model

### Docker Deployment (Recommended)

```bash
docker run -d \
  --name agent \
  -p 5200:5200 \
  -e ANTHROPIC_API_KEY=your-key \
  -v $(pwd):/project \
  deepracticexs/agent:latest
```

**Container Architecture**:

- Base image: `deepracticexs/agent-runtime:latest` (Node.js + system tools)
- Single process: agent-service
- Volume mounts: project directory, SSH keys, git config
- Port: 5200 (exposed)

### Local Development

```bash
# Install dependencies
pnpm install

# Start dev environment (frontend + server)
pnpm dev

# Build for production
pnpm build

# Run production build locally
cd apps/agent
pnpm start
# or use CLI
agentx http --port 5200
```

## Session Management

Sessions are stored in SQLite database at `~/.claude/agent/sessions.db`:

**Schema**:

- `sessions` - Session metadata (id, name, timestamp, messages)
- `messages` - Chat messages (session_id, role, content, attachments)

**Flow**:

1. User creates session → `POST /api/sessions`
2. User sends message → WebSocket `/ws`
3. Agent processes with Claude SDK
4. Response streamed back → WebSocket
5. Messages persisted → SQLite

## Key Design Decisions

### Why Monorepo?

**Benefits**:

- Shared TypeScript types between frontend and backend
- Unified dependency management
- Atomic commits across full stack
- Easier refactoring

**Structure**: Follows industry best practices (Nx, Turborepo patterns)

### Why Server Serves Static Files?

**Reasons**:

- Simplifies deployment (single container, single npm package)
- Reduces infrastructure complexity (no separate frontend server)
- Better for desktop-class applications (like VS Code, Cursor)
- WebSocket connections share same origin

### Why Separate Frontend and Server in Development?

**Reasons**:

- Fast HMR in frontend (Vite dev server)
- Server can reload independently
- Clear separation of concerns
- Better debugging experience

### Why Merge into Single Package?

**Reasons**:

- Simpler dependency management (one package.json for the app)
- Easier deployment (publish once to npm, use as CLI or in Docker)
- Better user experience (install one package, get everything)
- Reduced overhead (no workspace complexity for small monorepo)

## Future Considerations

- **MCP Service Integration**: Port 5203 reserved for PromptX MCP server
- **Multi-Project Support**: Workspace-level session management
- **Plugin System**: Extensible command and tool system
- **Distributed Mode**: Optional separation for enterprise deployments

---

**Last Updated**: 2025-11-05
**Maintainer**: Deepractice Engineering Team
