# Monorepo Setup for Claude Code UI

This document describes the configuration changes made to integrate Claude Code UI into the Project October monorepo.

## Changes Made

### 1. Directory Structure
```
ProjectOctober/
├── apps/
│   └── claudecodeui/          # Claude Code UI application
│       ├── src/               # Frontend source
│       ├── server/            # Backend source
│       ├── public/            # Static assets
│       ├── dist/              # Build output
│       ├── docs/              # Documentation
│       │   └── API_DOCUMENTATION.md
│       ├── package.json       # App dependencies
│       ├── turbo.json         # Turbo config for this app
│       ├── vite.config.js     # Vite config
│       └── .env.example       # Environment template
├── services/                   # (Future microservices)
├── packages/                   # (Future shared packages)
├── pnpm-workspace.yaml        # Workspace definition
├── turbo.json                 # Root Turbo config
└── package.json               # Root package.json
```

### 2. Root Configuration

#### `package.json`
- **Name**: `project-october` (changed from `@siteboon/claude-code-ui`)
- **Version**: `1.0.0`
- **Private**: `true`
- **Scripts**:
  - `dev`: Run development mode via Turbo
  - `build`: Build all apps via Turbo
  - `lint`: Lint all apps via Turbo
  - `clean`: Clean all build artifacts
- **Engines**: Node.js >=20.0.0, pnpm >=9.0.0

#### `pnpm-workspace.yaml`
```yaml
packages:
  - apps/*
  - services/*

ignoredBuiltDependencies:
  - bcrypt
  - better-sqlite3
  - esbuild
  - node-pty
  - sharp
  - sqlite3
```

**Why ignore built dependencies?**
- These are native modules with platform-specific binaries
- Need to be built separately for each platform
- Prevents pnpm from caching pre-built binaries across platforms

#### `turbo.json`
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": { "outputs": [] },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": { "cache": false }
  },
  "globalEnv": [
    "NODE_ENV",
    "PORT",
    "VITE_PORT",
    "JWT_SECRET",
    "DATABASE_PATH",
    "CONTEXT_WINDOW",
    "VITE_CONTEXT_WINDOW"
  ]
}
```

### 3. App Configuration

#### `apps/claudecodeui/package.json`
- **Name**: `@project-october/claudecodeui` (changed from `@siteboon/claude-code-ui`)
- **Private**: `true` (added to prevent accidental publishing)
- **Version**: `1.10.4` (preserved from original)
- **Scripts**: Unchanged (dev, build, server, client, start)
- **Dependencies**: All preserved from original

#### `apps/claudecodeui/turbo.json`
```json
{
  "$schema": "https://turbo.build/schema.json",
  "extends": ["//"],
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true,
      "dependsOn": []
    },
    "build": {
      "outputs": ["dist/**"],
      "dependsOn": []
    },
    "server": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["build"]
    },
    "client": {
      "cache": false,
      "persistent": true,
      "dependsOn": []
    },
    "start": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["build"]
    }
  }
}
```

### 4. Cleanup Actions

**Removed files**:
- `.git/` - Removed nested git repository (app now uses root git)
- `.nvmrc` - Node version managed at root level
- `.release-it.json` - Release process handled at root
- `release.sh` - Release script handled at root

**Updated files**:
- `.gitignore` - Cleaned up and organized
- `README.md` - Updated to reflect monorepo structure

### 5. Documentation

**Created**:
- `docs/API_DOCUMENTATION.md` - Comprehensive backend API documentation
- `MONOREPO_SETUP.md` - This file

**Updated**:
- `README.md` - Added monorepo context and usage instructions

## Usage

### From Monorepo Root

```bash
# Install all dependencies
pnpm install

# Start claudecodeui in development mode
pnpm --filter @project-october/claudecodeui dev

# Build claudecodeui
pnpm --filter @project-october/claudecodeui build

# Start production server
pnpm --filter @project-october/claudecodeui start

# Run specific script
pnpm --filter @project-october/claudecodeui server
```

### From App Directory

```bash
cd apps/claudecodeui

# All scripts work as before
pnpm dev
pnpm build
pnpm start
pnpm server
pnpm client
```

## Environment Variables

Each app maintains its own `.env` file:

```
apps/claudecodeui/.env
```

Copy from `.env.example` and configure:

```bash
PORT=3001
VITE_PORT=5173
CLAUDE_CLI_PATH=claude
CONTEXT_WINDOW=160000
VITE_CONTEXT_WINDOW=160000
```

## Benefits of Monorepo Setup

1. **Unified Dependency Management**
   - Single `pnpm-lock.yaml` for entire project
   - Shared dependencies deduplicated
   - Faster installs with workspace linking

2. **Coordinated Builds**
   - Turbo caching for faster rebuilds
   - Parallel task execution
   - Dependency-aware task scheduling

3. **Code Sharing**
   - Future: Shared packages in `packages/`
   - Type-safe imports between apps
   - Consistent tooling across apps

4. **Simplified CI/CD**
   - Single git repository
   - Atomic commits across apps
   - Easier versioning and releases

5. **Developer Experience**
   - Single place to clone
   - Consistent commands across apps
   - Easier onboarding

## Future Enhancements

### Potential Structure
```
ProjectOctober/
├── apps/
│   ├── claudecodeui/          # Current app
│   ├── admin-panel/           # Future: Admin UI
│   └── mobile-app/            # Future: Mobile app
├── services/
│   ├── backend-service/       # Future: Extracted backend
│   ├── auth-service/          # Future: Auth microservice
│   └── mcp-service/           # Future: MCP management service
└── packages/
    ├── ui/                    # Future: Shared UI components
    ├── utils/                 # Future: Shared utilities
    └── types/                 # Future: Shared TypeScript types
```

### Recommended Packages to Extract

1. **@project-october/ui** - Shared React components
   - Button, Input, Modal, etc.
   - Consistent design system
   - Storybook integration

2. **@project-october/utils** - Shared utilities
   - API client helpers
   - Date/time formatting
   - Validation functions

3. **@project-october/types** - Shared TypeScript types
   - API request/response types
   - Domain models
   - Utility types

4. **@project-october/config** - Shared configuration
   - ESLint config
   - TypeScript config
   - Prettier config

## Migration Notes

### Breaking Changes
- Package name changed: `@siteboon/claude-code-ui` → `@project-october/claudecodeui`
- Root scripts now use Turbo: `pnpm dev` → `turbo dev`

### Non-Breaking Changes
- All app-level scripts work as before when run from `apps/claudecodeui/`
- Dependencies unchanged
- Build output unchanged
- Environment variables unchanged

## Troubleshooting

### Issue: Native modules fail to build
**Solution**: Run `pnpm install` from root, not from app directory

### Issue: Turbo cache issues
**Solution**: Run `pnpm clean` and rebuild

### Issue: Environment variables not working
**Solution**: Ensure `.env` file is in `apps/claudecodeui/`, not root

### Issue: Port conflicts
**Solution**: Update PORT and VITE_PORT in `apps/claudecodeui/.env`

## Related Documentation

- [API Documentation](./docs/API_DOCUMENTATION.md)
- [Original README](./README.md)
- [Turbo Documentation](https://turbo.build/repo/docs)
- [pnpm Workspace Documentation](https://pnpm.io/workspaces)
