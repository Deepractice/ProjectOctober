# Agent SDK Architecture Rules

Custom ESLint rules enforcing layered architecture for `@deepractice-ai/agent-sdk`.

## Rules

### 1. Layer Dependency (`layer-dependency`)

**Severity**: Error

Enforces strict dependency flow between architectural layers.

**Allowed Dependencies:**

```
api/         → facade/, types/, errors/
facade/      → core/, adapters/, persistence/, types/, errors/, utils/
core/        → types/, errors/, utils/ (NO api/, NO facade/)
errors/      → (pure error definitions, minimal imports)
types/       → (pure types, no imports)
adapters/    → types/, errors/, utils/
persistence/ → types/, errors/, utils/
utils/       → types/
```

**Examples:**

```typescript
// ✅ GOOD: api/ importing from facade/
// src/api/agent.ts
export { createAgent } from "~/facade/agent";

// ❌ BAD: api/ importing from core/
// src/api/agent.ts
export { AgentCore } from "~/core/agent/Agent"; // ERROR!

// ✅ GOOD: facade/ importing from core/
// src/facade/agent.ts
import { AgentCore } from "~/core/agent/Agent";

// ❌ BAD: core/ importing from facade/
// src/core/agent/Agent.ts
import { createAgent } from "~/facade/agent"; // ERROR!
```

### 2. File Naming (`file-naming`)

**Severity**: Warning

Enforces consistent file naming conventions.

**Rules:**

- **PascalCase**: Files exporting ONE class/interface
  - Example: `Agent.ts`, `BaseSession.ts`, `WebSocketBridge.ts`
- **camelCase**: Files exporting multiple utilities/types
  - Example: `agent.ts` (facade), `helpers.ts`, `protocol.ts`

**Examples:**

```typescript
// ✅ GOOD: Single class → PascalCase
// src/core/agent/Agent.ts
export class AgentCore { ... }

// ❌ BAD: Single class → camelCase
// src/core/agent/agent.ts (should be Agent.ts)
export class AgentCore { ... }

// ✅ GOOD: Multiple exports → camelCase
// src/facade/agent.ts
export { createAgent };
export { AgentCore };
```

### 3. API Exports (`api-exports`)

**Severity**: Error

Ensures `api/` layer only exposes facade, types, and errors.

**Rules:**

- `api/` files can only export from `facade/`, `types/`, or `errors/`
- `api/` must NOT expose `core/` internals directly

**Examples:**

```typescript
// ✅ GOOD: Exporting from facade/
// src/api/agent.ts
export { createAgent } from "~/facade/agent";

// ✅ GOOD: Exporting types
// src/api/index.ts
export type { Agent, Session } from "~/types";

// ✅ GOOD: Exporting errors
// src/api/index.ts
export { AgentError, AgentErrorCode } from "~/errors/base";

// ❌ BAD: Exporting from core/
// src/api/agent.ts
export { AgentCore } from "~/core/agent/Agent"; // ERROR!
```

## Architecture Benefits

1. **Clear Boundaries**: Each layer has explicit responsibilities
2. **Easy Refactoring**: `core/` can change without breaking `api/`
3. **Testability**: Layers can be tested independently
4. **Maintainability**: Dependencies flow in one direction

## Running Checks

```bash
# Check all architecture rules
pnpm lint

# Auto-fix violations (limited)
pnpm lint --fix
```

## Disabling Rules

Only disable when absolutely necessary:

```typescript
/* eslint-disable sdk-arch/layer-dependency */
import { AgentCore } from "~/core/agent/Agent";
/* eslint-enable sdk-arch/layer-dependency */
```

## Adding New Rules

1. Create rule file in `lint/rules/`
2. Export rule from `lint/index.js`
3. Enable in `eslint.config.mjs`
4. Document in this README
