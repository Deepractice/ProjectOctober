# Agent Web

Web application for Deepractice AI Agent - Gateway + UI integration.

## Overview

This is the main web application that integrates the agent-ui component library and serves as the unified gateway for the Agent platform.

## Architecture

- **Port**: 5200 (production), 5202 (development)
- **UI Components**: Uses `@deepractice-ai/agent-ui` package
- **Backend API**: Proxies to `agent-service` on port 5201
- **Role**: Unified entry point for all Agent web services

## Development

```bash
# Start dev server (port 5202)
pnpm dev

# Start with backend service
pnpm dev:full

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Production

In production, this application runs on port 5200 and serves:

- Static UI files from agent-ui
- API proxy to agent-service (5201)
- WebSocket connections

See [Port Allocation](../../docs/port-allocation.md) for details.

## Directory Structure

```
apps/agent-web/
├── src/
│   └── main.jsx        # Entry point
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
└── package.json        # Dependencies
```

Note: UI components are imported from `packages/agent-ui`.
