# Architecture Overview

## Core Philosophy

Agent is a **full-stack desktop-class application** packaged as a Docker container. It follows the principle of "separated development, unified deployment" - components are developed independently in a monorepo but deployed as a single unit.

## Project Structure

```
Agent/
├── apps/
│   └── agent-web/              # React frontend application
│       ├── src/                # UI source code
│       ├── vite.config.js      # Vite build configuration
│       └── dist/               # Build output (production)
│
├── packages/
│   ├── agent-config/           # Configuration management library
│   ├── agent-sdk/              # Claude SDK integration library
│   └── agent-ui/               # Shared UI components (legacy)
│
└── services/
    └── agent-service/          # Node.js backend server
        ├── src/
        │   ├── routes/         # API endpoints
        │   ├── websocket/      # WebSocket handlers
        │   ├── agent.js        # Claude Agent integration
        │   ├── app.js          # Express app configuration
        │   └── index.js        # Server entry point
        └── dist/               # Frontend build (copied in production)
```

## Component Architecture

### agent-service (Backend + Gateway)

**Role**: Unified entry point for the entire application

**Responsibilities**:

- Serve REST API endpoints (`/api/*`)
- Handle WebSocket connections (`/ws`, `/shell`)
- Serve static frontend files in production (`/*`)
- Integrate with Claude Agent SDK
- Manage sessions, commands, and project state

**Port**: 5200 (unified for both dev and prod)

**Key Files**:

- `src/index.js` - Server startup, configuration loading
- `src/app.js` - Express app, route mounting, static file serving
- `src/agent.js` - Claude Agent SDK integration
- `src/websocket/chat.js` - Chat WebSocket handler
- `src/websocket/shell.js` - Terminal WebSocket handler

### agent-web (Frontend Application)

**Role**: React-based user interface

**Responsibilities**:

- Render UI components
- Manage client-side state
- Communicate with backend via HTTP and WebSocket
- Provide code editor, terminal, and chat interface

**Development Port**: 5173 (Vite default, with HMR)
**Production**: Static files served by agent-service

**Key Files**:

- `src/App.tsx` - Main application component
- `src/components/ChatInterface.tsx` - Chat UI
- `src/components/Terminal.tsx` - Terminal emulator
- `src/stores/sessionStore.ts` - Zustand state management

### packages/\* (Shared Libraries)

**agent-config**: Configuration management with multi-source loading (env, file, database)
**agent-sdk**: Claude Agent SDK wrapper and session management
**agent-ui**: Shared UI components (being phased out, moved to agent-web)

## Port Design

### Unified Port Strategy

```
Development:
  User → http://localhost:5173 (Vite dev server)
         ├─ /api/* → proxy to :5200 (agent-service)
         ├─ /ws → proxy to :5200 (WebSocket)
         └─ /* → Vite HMR

Production (Docker):
  User → http://localhost:5200 (agent-service)
         ├─ /api/* → handled by Express
         ├─ /ws → handled by WebSocket server
         └─ /* → static files from dist/
```

**Key Principle**: agent-service is always the source of truth on port 5200. In development, Vite runs alongside on 5173 for HMR, but all API/WebSocket traffic goes to agent-service.

## Data Flow

### HTTP Request Flow

```
Browser
  ↓ GET /api/sessions
agent-service (Express)
  ↓ read from SQLite
  ↓ return JSON
Browser
```

### WebSocket Flow (Chat)

```
Browser
  ↓ WebSocket connection to /ws
agent-service (WebSocket Server)
  ↓ authenticate & route
websocket/chat.js
  ↓ create Claude Agent session
Claude SDK
  ↓ stream responses
Browser (real-time updates)
```

### WebSocket Flow (Terminal)

```
Browser
  ↓ WebSocket connection to /shell
agent-service (WebSocket Server)
  ↓ spawn PTY process
node-pty
  ↓ execute shell commands
File system / Project
```

## Development vs Production

### Development Environment

**Start Command**: `pnpm dev` (runs both services in parallel)

1. **agent-service** starts on port 5200
   - Loads config from `.env`
   - Starts Express + WebSocket server
   - Does NOT serve static files (dev mode)

2. **agent-web** starts on port 5173
   - Vite dev server with HMR
   - Proxies `/api/*`, `/ws`, `/shell` to :5200
   - Hot reload on file changes

**Developer Access**: Open http://localhost:5173

### Production Environment (Docker)

**Image**: `deepracticexs/agent:latest`

**Build Process**:

1. Build agent-web → `apps/agent-web/dist/`
2. Copy dist to `services/agent-service/dist/`
3. Package agent-service + dist into Docker image

**Runtime**:

- Single Node.js process running agent-service
- Serves static files from `dist/`
- All requests go to port 5200

**User Access**: `docker run -p 5200:5200 deepracticexs/agent`

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
- **Zod** - Schema validation (agent-config)

## Configuration System

Agent uses a layered configuration system provided by `@deepractice-ai/agent-config`:

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

# Start dev environment (both services)
pnpm dev

# Build for production
pnpm build

# Run production build locally
cd services/agent-service
PORT=5200 node src/index.js
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

### Why agent-service Serves Static Files?

**Reasons**:

- Simplifies deployment (single container)
- Reduces infrastructure complexity (no separate frontend server)
- Better for desktop-class applications (like VS Code, Cursor)
- WebSocket connections share same origin

### Why Separate agent-web and agent-service in Development?

**Reasons**:

- Fast HMR in frontend (Vite dev server)
- Backend can reload independently
- Clear separation of concerns
- Better debugging experience

## Future Considerations

- **MCP Service Integration**: Port 5203 reserved for PromptX MCP server
- **Multi-Project Support**: Workspace-level session management
- **Plugin System**: Extensible command and tool system
- **Distributed Mode**: Optional separation for enterprise deployments

---

**Last Updated**: 2025-11-05
**Maintainer**: Deepractice Engineering Team
