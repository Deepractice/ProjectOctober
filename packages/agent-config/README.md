# @deepractice-ai/agent-config

Configuration management for the Agent project.

## Features

- **Schema-driven**: Type-safe configuration with Zod validation
- **Multi-source**: Load from .env, database, or UI
- **Priority-based merging**: Higher priority sources override lower ones
- **Convention over configuration**: Sensible defaults for 90% of use cases

## Architecture

```
Schema (Source of Truth)
   ↓
├─ Loaders (Input Channels)
│  ├─ EnvLoader (.env file) - Priority: 10
│  ├─ DBLoader (Database) - Priority: 20
│  └─ UILoader (UI input) - Priority: 30
│
└─ Persisters (Output Channels)
   ├─ DBPersister (Save to database)
   └─ FilePersister (Save to .env.local)
```

## Usage

### Basic Usage

```typescript
import { getConfig } from "@deepractice-ai/agent-config";

// Load configuration from all sources
const config = await getConfig();

console.log(config.port); // 5201
console.log(config.anthropicApiKey); // sk-...
```

### Update Configuration

```typescript
import { updateConfig } from "@deepractice-ai/agent-config";

// Update config and persist to file
await updateConfig(
  {
    port: 5202,
    contextWindow: 200000,
  },
  { persist: true }
);
```

### UI Integration

```typescript
import { updateConfigFromUI } from "@deepractice-ai/agent-config";

// User updates config in web interface
await updateConfigFromUI({
  anthropicApiKey: "sk-new-key",
  contextWindow: 180000,
});
```

### Validation

```typescript
import { validateConfig } from "@deepractice-ai/agent-config";

const result = validateConfig({
  port: "invalid", // Should be number
});

if (!result.valid) {
  console.error(result.errors);
}
```

## Configuration Schema

| Key                | Type                                      | Default                       | Description                   |
| ------------------ | ----------------------------------------- | ----------------------------- | ----------------------------- |
| `port`             | `number`                                  | `5201`                        | Backend service port          |
| `nodeEnv`          | `'development' \| 'production' \| 'test'` | `'development'`               | Environment                   |
| `vitePort`         | `number`                                  | `5200`                        | Frontend dev server port      |
| `frontendUrl`      | `string`                                  | `'http://localhost:5200'`     | Frontend URL for CORS         |
| `anthropicApiKey`  | `string`                                  | **Required**                  | Anthropic API key             |
| `anthropicBaseUrl` | `string`                                  | `'https://api.anthropic.com'` | Anthropic API endpoint        |
| `projectPath`      | `string`                                  | `'.'`                         | Default project directory     |
| `contextWindow`    | `number`                                  | `160000`                      | Context window size           |
| `logLevel`         | `'debug' \| 'info' \| 'warn' \| 'error'`  | `'info'`                      | Log level                     |
| `databasePath`     | `string`                                  | `undefined`                   | Database file path (optional) |

## Priority Order

When loading from multiple sources, higher priority wins:

1. **UILoader (30)**: User input from web interface
2. **DBLoader (20)**: Persisted configuration from database
3. **EnvLoader (10)**: Environment variables from .env file

## Development vs Production

- **Development Mode**: Relaxed validation (e.g., API key can be empty)
- **Production Mode**: Strict validation (all required fields must be present)

Mode is determined by `NODE_ENV` environment variable.

## Package Structure

```
src/
├── api/              # Public API (exported)
│   ├── getConfig.ts
│   ├── updateConfig.ts
│   └── validateConfig.ts
├── types/            # Type definitions (exported)
│   ├── Config.ts
│   └── ConfigSource.ts
└── core/             # Internal implementation (not exported)
    ├── schemas/      # Zod schemas
    ├── loaders/      # Input loaders
    ├── persisters/   # Output persisters
    └── ConfigManager.ts
```

## License

MIT
