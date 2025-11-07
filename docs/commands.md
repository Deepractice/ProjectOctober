# NPM Scripts Command Reference

This document describes the standardized npm scripts structure across the Agent monorepo.

## Quick Start

```bash
# Start development environment (service + web)
pnpm dev

# Build all packages
pnpm build

# Run code quality checks
pnpm lint
pnpm typecheck
pnpm format
```

## Root Commands

All commands run from the monorepo root (`/`).

### Development

```bash
pnpm dev
```

Starts the complete development environment:

1. Starts Vite dev server on http://localhost:5173 (frontend hot reload)
2. Starts agent server on http://localhost:5200 (unified API + WebSocket)

**Access the application at http://localhost:5173** (with HMR)

In development mode:

- Frontend changes hot-reload via Vite
- Backend proxies all non-API requests to Vite
- API endpoints available at `/api/*`
- WebSocket at `ws://localhost:5200/ws`

### Build

```bash
pnpm build
```

Builds all packages in the monorepo in dependency order:

1. `packages/agent-sdk` → library (dist/)
2. `apps/agent` → full-stack application (dist/web/, dist/server/, dist/cli/)

### Code Quality

```bash
# Lint all packages
pnpm lint

# Type check all TypeScript packages
pnpm typecheck

# Format all files with Prettier
pnpm format

# Check formatting without modifying files
pnpm format:check
```

### Testing & Cleanup

```bash
# Run tests across all packages
pnpm test

# Clean all build outputs and node_modules
pnpm clean
```

## Package-Specific Commands

Run commands in specific packages using the `--filter` flag:

```bash
# Build only the agent application
pnpm --filter @deepractice-ai/agent build

# Start agent in dev mode
pnpm --filter @deepractice-ai/agent dev

# Build only the SDK library
pnpm --filter @deepractice-ai/agent-sdk build
```

### apps/agent (Full-Stack Application)

```bash
cd apps/agent

# Development mode (frontend + server)
pnpm dev

# Development - frontend only
pnpm dev:web

# Development - server only
pnpm dev:server

# Production mode
pnpm start

# Build everything (web + server + CLI)
pnpm build

# Build frontend only
pnpm build:web

# Build server only
pnpm build:server

# Lint and type check
pnpm lint
pnpm typecheck
```

**Ports:**

- Development: 5173 (Vite) + 5200 (server)
- Production: 5200 (unified)

**Outputs:**

- `dist/web/` - Frontend static files
- `dist/server/` - Server bundle
- `dist/cli/bin.js` - CLI binary (executable)

### packages/agent-sdk (SDK Library)

```bash
cd packages/agent-sdk

# Build library (TypeScript)
pnpm build

# Lint and type check
pnpm lint
pnpm typecheck
```

**Outputs:**

- `dist/` - Compiled TypeScript

## Command Naming Conventions

### Standard Commands (all packages should have)

- `dev` - Start development server/watcher
- `build` - Build for production
- `lint` - Run ESLint
- `typecheck` - Run TypeScript compiler (tsc --noEmit)

### Optional Commands

- `start` - Start production server (services only)
- `preview` - Preview production build (apps only)
- `test` - Run tests
- `format` - Format code with Prettier
- `clean` - Clean build outputs

### Naming Rules

1. Use lowercase with hyphens: `build:watch`, not `buildWatch`
2. Use colons for variants: `dev:verbose`, `build:watch`
3. Keep names consistent across packages
4. Prefix custom scripts clearly: `db:migrate`, `docs:build`

## Turbo Configuration

Commands are orchestrated by Turborepo (`turbo.json`):

```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"], // Build dependencies first
      "outputs": ["dist/**"]
    },
    "dev": {
      "dependsOn": ["^build"], // Build libraries before dev
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"] // Need types from dependencies
    }
  }
}
```

**Dependency syntax:**

- `^build` - Build all workspace dependencies first
- `["dep-a", "dep-b"]` - Run tasks in same package first

## Execution Flow

### `pnpm dev` Flow

```
┌─────────────────────────────────────────┐
│ User runs: pnpm dev                     │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Start Vite dev server (background)     │
│ - Port 5173                             │
│ - Hot reload enabled                    │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Wait for Vite to be ready               │
│ - http://localhost:5173                 │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Start agent-service                     │
│ - Port 5200                             │
│ - Proxies to Vite for frontend assets  │
│ - Serves API at /api/*                  │
│ - WebSocket at /ws                      │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ ✅ Ready at http://localhost:5200       │
└─────────────────────────────────────────┘
```

### `pnpm build` Flow

```
packages/agent-sdk  →  apps/agent
     (library)         (consumes SDK)
```

Build order is automatically determined by Turbo based on workspace dependencies.

## Environment Variables

See `.env.example` for all available variables.

**Common variables:**

```bash
# Agent Server
PORT=5200                       # Agent server port (unified entry point)
ANTHROPIC_API_KEY=sk-xxx        # Required for Claude SDK
ANTHROPIC_BASE_URL=https://...  # Optional, custom API endpoint
PROJECT_PATH=/path/to/project   # Default workspace for Claude SDK

# Development
NODE_ENV=development            # Environment mode
```

## Troubleshooting

### "Cannot find module '@deepractice-ai/agent-sdk'"

The SDK library hasn't been built yet. Run:

```bash
pnpm --filter @deepractice-ai/agent-sdk build
# or
pnpm build
```

### Port already in use

Check and kill the process:

```bash
lsof -ti:5200 | xargs kill -9  # Agent service
lsof -ti:5173 | xargs kill -9  # Vite dev server
```

### Build cache issues

Clean and rebuild:

```bash
pnpm clean
pnpm build
```

### Changes to agent-sdk not reflected

The SDK library needs to be rebuilt after changes:

```bash
# Rebuild manually
pnpm --filter @deepractice-ai/agent-sdk build

# Or rebuild everything
pnpm build
```

## Best Practices

1. **Always use root commands** for development: `pnpm dev` (not individual package commands)
2. **Build libraries first** before running apps that depend on them
3. **Use Turbo filters** to run commands on specific packages when needed
4. **Keep commands simple** - avoid complex shell scripts in package.json
5. **Document custom commands** if they deviate from standards

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Port Allocation](./port-allocation.md)
- [Monorepo Setup](../packages/agent-ui/docs/MONOREPO_SETUP.md)
