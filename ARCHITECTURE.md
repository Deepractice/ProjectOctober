# Architecture Overview

## Project Structure

```
Agent/
├── apps/                       # Applications (executable entry points)
│   └── agent-web/             # Web application (port 5200/5202)
│       ├── src/
│       │   └── main.jsx       # Entry point
│       ├── vite.config.js     # Vite configuration
│       └── package.json
│
├── packages/                   # Reusable libraries
│   └── agent-ui/              # UI component library
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── stores/        # State management
│       │   ├── App.jsx        # Main App component
│       │   └── index.css      # Global styles
│       └── package.json
│
└── services/                   # Backend services
    └── agent-service/         # API server (port 5201)
        ├── src/
        │   ├── routes/        # API routes
        │   ├── core/          # Core logic
        │   ├── websocket/     # WebSocket handlers
        │   └── index.js       # Server entry point
        └── package.json
```

## Component Responsibilities

### agent-web (Application)

- **Type**: Web Application
- **Port**: 5200 (production), 5202 (development)
- **Role**: Main entry point for users
- **Dependencies**: Uses `@deepractice-ai/agent-ui` for UI components

### agent-ui (Package)

- **Type**: UI Component Library
- **Role**: Provides reusable React components
- **Used by**: agent-web
- **No independent port**: Library only

### agent-service (Service)

- **Type**: Backend API Service
- **Port**: 5201
- **Role**: REST API + WebSocket server
- **Provides**: Agent functionality, file operations, session management

## Data Flow

```
User Browser
    ↓
agent-web (5202 dev / 5200 prod)
    ↓ (uses components from)
agent-ui (UI library)
    ↓ (API calls)
agent-service (5201)
    ↓
Anthropic Claude API
```

## Deployment Model

### Development

- agent-web: Vite dev server on 5202 (hot reload)
- agent-service: Node server on 5201
- agent-ui: Imported as workspace dependency

### Production

- agent-web: Production build on 5200 (static + proxy)
- agent-service: Node server on 5201
- agent-ui: Bundled into agent-web

## Technology Stack

### Frontend (agent-web + agent-ui)

- React 18
- Vite
- TailwindCSS
- Zustand (state management)
- CodeMirror (code editor)
- XTerm.js (terminal)

### Backend (agent-service)

- Node.js
- Express
- WebSocket (ws)
- SQLite (sessions)
- Claude Agent SDK

## Port Allocation

See [docs/port-allocation.md](./docs/port-allocation.md) for details.

- 5200: agent-web (production)
- 5201: agent-service (API)
- 5202: agent-web (development)
