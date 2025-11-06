# Environment Configuration

Simple and standard environment file management.

## Quick Start

```bash
# 1. Copy local template
cp env/.env.example env/.env.local

# 2. Edit and add your secrets
nano env/.env.local  # Add your ANTHROPIC_API_KEY

# 3. Run
pnpm dev
```

## File Structure

```
env/
├── .env.local          # Your local config + secrets (gitignored)
├── .env.development    # Development defaults (committed)
├── .env.test          # Test defaults (committed)
├── .env.production    # Production defaults (committed)
└── .env.example       # Template for new developers (committed)
```

## Loading Priority

Files are loaded in this order (later overwrites earlier):

1. `env/.env` (if exists - deprecated)
2. `env/.env.[environment]` (development/test/production - based on NODE_ENV)
3. `env/.env.local` (highest priority - your secrets and overrides)

**Example** (NODE_ENV=development):

```text
PORT in env/.env.development  = 5200
PORT in env/.env.local        = 5300  ← wins
```

## Configuration Architecture

### Phase 1: Load env files (dotenv)

Service entry point loads files into `process.env`

### Phase 2: Config management (@deepractice-ai/agent-config)

- **EnvLoader**: Reads from `process.env`, maps to schema
- **Validation**: Validates types with Zod
- **API**: Provides unified `getConfig()` / `config()` interface

**Future extensibility**:

- Can add custom loaders via `ConfigManager.addLoader()`
- Example: DatabaseLoader, UILoader, etc.
- Higher priority loaders override lower ones

**Separation of concerns**:

- `dotenv` → file loading
- `EnvLoader` → process.env → config mapping
- `ConfigManager` → validation + merging

## Available Variables

See `env/.env.example` for full list with descriptions.

**Core variables**:

- `ANTHROPIC_API_KEY` - Your API key (required)
- `ANTHROPIC_BASE_URL` - API endpoint (optional)
- `PORT` - Service port (default: 5200)
- `NODE_ENV` - Environment (development/test/production)
- `PROJECT_PATH` - Default project directory

## Best Practices

✅ **DO**:

- Put secrets in `env/.env.local` (gitignored)
- Commit environment templates (`env/.env.development`, etc.)
- Use `env/.env.local` for all local overrides

❌ **DON'T**:

- Don't commit `env/.env.local` (contains secrets)
- Don't put secrets in `env/.env.development` (committed)
- Don't modify `process.env` directly in code

## For Developers

### Adding New Config Variables

1. **Add to schema** (`packages/agent-config/src/core/schemas/base.ts`)
2. **Add to EnvLoader** (`packages/agent-config/src/core/loaders/EnvLoader.ts`)
3. **Add to templates** (`env/.env.example`, `env/.env.development`, etc.)
4. **Document** in this file

### Testing Different Environments

```bash
# Development (default)
pnpm dev

# Test
NODE_ENV=test pnpm test

# Production
NODE_ENV=production pnpm start
```
