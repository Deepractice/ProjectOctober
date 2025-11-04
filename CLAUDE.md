# Agent Project Guidelines

## AI Execution Mindset

**Core Principle**: Evaluate solutions by **structural quality**, not time cost.

### Decision Framework

- **上策**: Clear boundaries, single responsibility, stable patterns → Always choose this
- **中策**: Works but coupled, harder to refactor later
- **下策**: Scattered logic, hard to maintain

**Why**: For AI, writing 100 lines of clear code is cheaper than refactoring 50 lines of messy code. AI's cost is understanding chaos, not writing clarity.

## Architecture Rules

### Package Structure

```
packages/[name]/
├── src/
│   ├── api/      # Public exports
│   ├── types/    # Type definitions
│   ├── core/     # Internal (not exported)
│   └── index.ts  # Entry point
```

### Standards

- One file, one type (OOP style)
- Interface-first naming: `ConfigLoader` not `EnvConfigLoader`
- No Hungarian notation
- Import aliases: `~/*` internal, `@/*` external
- English for all code/comments

### When to Create Package

Create package when code has:

1. Distinct domain (config, auth, etc.)
2. Shared by multiple apps/services
3. Clear boundaries

Don't worry about "over-engineering" - structure clarity > code quantity.

## Environment Variables

Convention over configuration. Default values should work.

- `PORT=5201` - Backend service
- `VITE_PORT=5200` - Frontend dev
- `ANTHROPIC_API_KEY` - Required
- `ANTHROPIC_BASE_URL` - Default: <https://api.anthropic.com>

## Commands

```bash
pnpm dev    # Start service + web
pnpm build  # Build all
pnpm lint   # Lint all
```

See [docs/commands.md](docs/commands.md) for details.
