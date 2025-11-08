---
"@deepractice-ai/agent-sdk": minor
"@deepractice-ai/agent": minor
---

Remove configuration management from SDK, move to application layer

**Breaking Changes:**

- Removed `getConfig`, `updateConfig`, `validateConfig` exports from agent-sdk
- Removed `Config`, `ConfigUpdate`, `ConfigSource` types from agent-sdk
- Deleted `core/config` directory from agent-sdk

**Rationale:**

- SDK should not manage application configuration
- Configuration management belongs in the application layer
- Reduces SDK complexity and focuses on core functionality

**Migration:**
Applications using agent-sdk should manage their own configuration using:

- `node-config` (recommended for Node.js apps)
- Environment variables
- Custom configuration solutions

**New in @deepractice-ai/agent:**

- Added `node-config` for configuration management
- Created structured config files in `config/` directory
- Implemented typed `AppConfig` interface
- Environment variable mapping via `custom-environment-variables.json`
