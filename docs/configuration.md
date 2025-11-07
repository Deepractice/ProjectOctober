# Configuration Guide

## Overview

Agent uses environment-based configuration management with .env files and schema validation. All configuration is type-safe and validated at startup.

## Quick Start

**Development Environment:**

1. **Setup secrets** (REQUIRED - first time only):

   ```bash
   cp env/.env.secret.example env/.env.secret
   # Edit env/.env.secret and add your ANTHROPIC_API_KEY
   ```

2. **Run the project**:
   ```bash
   pnpm dev
   ```

The configuration system will automatically:

- Load sensitive credentials from `env/.env.secret`
- Load environment-specific config from `env/.env.development`
- Validate all values against schema
- Provide sensible defaults for optional fields

See [env/README.md](../env/README.md) for detailed environment configuration guide.

## Configuration Architecture

```
┌─────────────────────────────────────┐
│  apps/agent                          │
│  (Built-in config system)            │
└─────────────────────────────────────┘
            │
            ├─ Loading Priority
            │  ├─ CLI arguments (highest)
            │  ├─ Environment variables
            │  └─ .env files (lowest)
            │
            ├─ Validation (Runtime)
            │  └─ Type checking + defaults
            │
            └─ Sources
               ├─ .env files in project root
               └─ System environment variables
```

## Environment Variables

### Server Configuration

| Variable   | Type   | Default       | Description                                          |
| ---------- | ------ | ------------- | ---------------------------------------------------- |
| `PORT`     | number | `5201`        | Backend API server port                              |
| `NODE_ENV` | enum   | `development` | Environment: `development` \| `production` \| `test` |

### Frontend Configuration

| Variable       | Type   | Default                 | Description              |
| -------------- | ------ | ----------------------- | ------------------------ |
| `VITE_PORT`    | number | `5200`                  | Frontend dev server port |
| `FRONTEND_URL` | string | `http://localhost:5200` | Frontend URL for CORS    |

### Anthropic API

| Variable             | Type   | Default                     | Description                  |
| -------------------- | ------ | --------------------------- | ---------------------------- |
| `ANTHROPIC_API_KEY`  | string | **Required**                | Your Anthropic API key       |
| `ANTHROPIC_BASE_URL` | string | `https://api.anthropic.com` | API endpoint (can use relay) |

### Project Settings

| Variable         | Type   | Default  | Description                                       |
| ---------------- | ------ | -------- | ------------------------------------------------- |
| `PROJECT_PATH`   | string | `.`      | Default project directory                         |
| `CONTEXT_WINDOW` | number | `160000` | Context window budget                             |
| `LOG_LEVEL`      | enum   | `info`   | Log level: `debug` \| `info` \| `warn` \| `error` |

### Optional

| Variable        | Type   | Default     | Description        |
| --------------- | ------ | ----------- | ------------------ |
| `DATABASE_PATH` | string | `undefined` | Database file path |

## Configuration Priority

When multiple sources provide the same configuration, **higher priority wins**:

### Between Sources (Loaders)

1. **UILoader (30)**: User input from web interface (future)
2. **DBLoader (20)**: Persisted configuration from database (future)
3. **EnvLoader (10)**: Environment variables from `env/` directory

### Within EnvLoader (Environment Files)

Files are loaded in the following order (later files override earlier):

1. `env/.env` (lowest - deprecated, for backward compatibility)
2. `env/[environment]/.env` (environment-specific config based on NODE_ENV)
3. `env/[environment]/.env.local` (local overrides for specific environment)
4. `env/.env.secret` (highest - sensitive credentials, shared across all environments)

Example (NODE_ENV=development):

```
PORT in env/.env                        = 5201
PORT in env/development/.env            = 5200  ← Overrides env/.env
PORT in env/development/.env.local      = 5300  ← Overrides above
ANTHROPIC_API_KEY in env/.env.secret    = sk-xxx  ← Overrides all env files (highest priority)
PORT in database                        = 5400  ← Overrides all env files (DBLoader priority 20)
PORT from UI                            = 5500  ← Overrides everything (UILoader priority 30)
Final PORT                              = 5500
Final ANTHROPIC_API_KEY                 = sk-xxx (from .env.secret, no DB/UI override)
```

## Usage in Code

### Server

Configuration is loaded automatically from environment variables and .env files:

```typescript
// apps/agent/server/core/config.ts
import dotenv from "dotenv";

// Load .env file
dotenv.config();

// Access configuration
const port = process.env.PORT || 5200;
const apiKey = process.env.ANTHROPIC_API_KEY;
```

### Frontend

Frontend uses Vite's standard environment variables:

```typescript
// Access via import.meta.env
const apiUrl = import.meta.env.VITE_API_URL;
```

### CLI

CLI arguments override environment variables:

```bash
# Using environment variable
export ANTHROPIC_API_KEY=sk-xxx
agentx http

# Using CLI argument (takes precedence)
agentx http --anthropic-api-key sk-xxx
```

## Development vs Production

### Development Mode

- Relaxed validation
- `ANTHROPIC_API_KEY` can be empty (warning only)
- Extra keys allowed in config
- Uses `env/development/.env` by default
- Can be overridden with `env/development/.env.local`

### Production Mode

- Strict validation
- All required fields must be present
- No extra keys allowed
- Uses `env/production/.env` or environment variables from deployment platform

## Configuration Files

All environment files are now located in the `env/` directory for better organization.

### `env/.env.secret` (REQUIRED)

**Sensitive credentials** - gitignored, shared across all environments:

```bash
# Copy from env/.env.secret.example
ANTHROPIC_API_KEY=your-actual-api-key
ANTHROPIC_BASE_URL=https://relay.deepractice.ai/api
```

**Setup**:

```bash
cp env/.env.secret.example env/.env.secret
# Edit and add your credentials
```

### `env/development/.env`

Development environment configuration (committed to git):

```bash
# Development settings (no secrets!)
PORT=5200
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
PROJECT_PATH=/Users/sean/Deepractice/projects/Agent/demo
```

### `env/test/.env`

Test environment configuration (committed to git):

```bash
# Test settings (no secrets!)
PORT=5201
NODE_ENV=test
FRONTEND_URL=http://localhost:5174
PROJECT_PATH=/tmp/agent-test-workspace
```

### `env/production/.env`

Production environment configuration (committed to git):

```bash
# Production settings (no secrets!)
PORT=5200
NODE_ENV=production
FRONTEND_URL=https://agent.deepractice.ai
PROJECT_PATH=/var/lib/agent/workspace
```

### `env/[environment]/.env.local`

Personal local overrides for **non-sensitive** config per environment (gitignored, optional):

```bash
# Example: env/development/.env.local
PROJECT_PATH=/Users/you/custom/path
PORT=5300
LOG_LEVEL=debug
```

### `env/.env.example`

General template for new developers (committed to git).

## Docker Configuration

Environment variables in Docker:

**docker-compose.yml:**

```yaml
services:
  agent:
    image: deepracticexs/agent:latest
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - ANTHROPIC_BASE_URL=${ANTHROPIC_BASE_URL:-https://api.anthropic.com}
      - NODE_ENV=production
      - PORT=5200
    volumes:
      - ${PROJECT_PATH:-.}:/project
```

**Run with environment file:**

```bash
# Create your own Docker env file based on example
cp env/.env.example env/.env.docker
# Edit env/.env.docker with your values

# Then run with it
docker-compose --env-file env/.env.docker up

# Or use production env file
docker-compose --env-file env/.env.production up
```

## Troubleshooting

### Configuration not loading

**Check initialization:**

```javascript
// Ensure initConfig() is called before config()
await initConfig(); // ← Must be called first
const port = config().port; // ← Will throw if not initialized
```

**Check .env location:**

```bash
# Verify environment files exist in env/ directory
ls -la /path/to/Agent/env/
```

### Validation errors

**Development mode example:**

```
Configuration validation failed:
  - port: Expected number, received string
  - anthropicApiKey: String must contain at least 1 character(s)
```

**Fix:** Check your `.env` file for correct types and values.

### Environment variable not working

**Check variable name mapping:**

```javascript
// EnvLoader maps these automatically:
PORT                → config().port
NODE_ENV            → config().nodeEnv
ANTHROPIC_API_KEY   → config().anthropicApiKey
```

**Check turbo.json:**

Ensure variable is declared in `globalEnv`:

```json
{
  "globalEnv": [
    "NODE_ENV",
    "PORT",
    "ANTHROPIC_API_KEY",
    ...
  ]
}
```

## Advanced Usage

### Environment Variable Validation

Configuration is validated at runtime with type checking:

```typescript
// apps/agent/server/core/config.ts
function loadConfig() {
  const port = parseInt(process.env.PORT || "5200");

  if (isNaN(port)) {
    throw new Error("PORT must be a valid number");
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required");
  }

  return { port, anthropicApiKey: process.env.ANTHROPIC_API_KEY };
}
```

## Best Practices

### ✅ Do

- **Put ALL secrets** in `env/.env.secret` (API keys, tokens, passwords)
- Use `env/[environment]/.env` for environment-specific non-sensitive config
- Use `env/[environment]/.env.local` for personal non-sensitive overrides
- Commit `env/development/.env`, `env/test/.env`, `env/production/.env` to git
- Commit `env/.env.secret.example` (with empty values) to git
- Use environment variables in CI/CD for production
- Validate configuration at startup

### ❌ Don't

- **NEVER commit `env/.env.secret`** to git (contains real credentials)
- Don't put secrets in environment templates (`env/development/.env`, etc.)
- Don't put secrets in `.env.local` (use `env/.env.secret` instead)
- Don't hardcode configuration values
- Don't bypass schema validation
- Don't modify `dist/` files directly
- Don't use `process.env` directly (use `config()`)

## Future Enhancements

Planned features for agent-config:

- **UI Configuration Panel**: Edit config from web interface
- **Database Persistence**: Store user preferences
- **Configuration Profiles**: Switch between presets
- **Remote Configuration**: Load from API endpoint
- **Configuration History**: Track changes over time

## See Also

- [Commands Reference](./commands.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Agent Package README](../apps/agent/README.md)
