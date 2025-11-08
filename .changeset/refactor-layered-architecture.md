---
"@deepractice-ai/agent-sdk": minor
---

Refactor to layered architecture with adapter pattern

**Breaking Changes:**

- None (API remains backward compatible)

**New Features:**

- Introduce `AgentAdapter` interface for provider abstraction
- Add `SessionFactory` interface for flexible session creation
- Support dependency injection via `createAgent(config, dependencies?)`

**Architecture Changes:**

- Restructure to 3-layer architecture: `api/`, `types/`, `core/`
- Extract Claude-specific code to `adapters/claude/`
- Promote `persistence/` and `utils/` to top-level directories
- Implement dependency inversion principle (core depends on interfaces)

**Benefits:**

- Easy to add new AI providers (OpenAI, Gemini, etc.)
- Better testability with dependency injection
- Clearer separation of concerns
- More maintainable codebase
