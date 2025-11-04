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

1. Builds `@deepractice-ai/agent-ui` library (if needed)
2. Starts `@deepractice-ai/agent-service` backend
3. Starts `@deepractice-ai/agent-web` frontend

Access the application at http://localhost:5200

### Build

```bash
pnpm build
```

Builds all packages in the monorepo in dependency order:

1. `packages/agent-ui` → library (dist/)
2. `apps/agent-web` → web application (dist/)
3. `services/agent-service` → (no build step)

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
# Start only the backend service
pnpm --filter @deepractice-ai/agent-service dev

# Start only the web frontend
pnpm --filter @deepractice-ai/agent-web dev

# Build only the UI library
pnpm --filter @deepractice-ai/agent-ui build
```

### services/agent-service

```bash
cd services/agent-service

# Development mode (NODE_ENV=development)
pnpm dev

# Production mode (NODE_ENV=production)
pnpm start

# Lint JavaScript code
pnpm lint
```

**Port:** 5201 (configured via `PORT` env var)

### apps/agent-web

```bash
cd apps/agent-web

# Start Vite dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint and type check
pnpm lint
pnpm typecheck
```

**Port:** 5200 (configured via `VITE_PORT` env var)

### packages/agent-ui

```bash
cd packages/agent-ui

# Build library (TypeScript + Vite)
pnpm build

# Build in watch mode
pnpm build:watch

# Lint and type check
pnpm lint
pnpm typecheck
```

**Outputs:**

- `dist/index.js` - ESM bundle
- `dist/index.cjs` - CommonJS bundle
- `dist/index.d.ts` - TypeScript definitions
- `dist/agent-ui.css` - Styles

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
│ Turbo checks dependencies               │
│ - agent-web depends on agent-ui         │
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Build packages/agent-ui                 │
│ - tsc -p tsconfig.build.json            │
│ - vite build                            │
│ Output: dist/{index.js,index.cjs,*.d.ts}│
└─────────────┬───────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│ Start services in parallel              │
│ ├─ agent-service (port 5201)            │
│ └─ agent-web (port 5200)                │
└─────────────────────────────────────────┘
```

### `pnpm build` Flow

```
packages/agent-ui  →  apps/agent-web
     (library)          (consumes library)
```

Build order is automatically determined by Turbo based on dependencies.

## Environment Variables

See `.env.example` for all available variables.

**Common variables:**

```bash
# Backend
PORT=5201                    # Agent service port
DATABASE_PATH=./data/agent.db
JWT_SECRET=your-secret-key

# Frontend
VITE_PORT=5200              # Web app port
```

## Troubleshooting

### "Cannot find module '@deepractice-ai/agent-ui'"

The library hasn't been built yet. Run:

```bash
pnpm --filter @deepractice-ai/agent-ui build
# or
pnpm build
```

### Port already in use

Check and kill the process:

```bash
lsof -ti:5200 | xargs kill -9  # Web
lsof -ti:5201 | xargs kill -9  # Service
```

### Build cache issues

Clean and rebuild:

```bash
pnpm clean
pnpm build
```

### Changes to agent-ui not reflected

The library needs to be rebuilt after changes:

```bash
# Option 1: Rebuild manually
pnpm --filter @deepractice-ai/agent-ui build

# Option 2: Watch mode (auto-rebuild on changes)
pnpm --filter @deepractice-ai/agent-ui build:watch
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
