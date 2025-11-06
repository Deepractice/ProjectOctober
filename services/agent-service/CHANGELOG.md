# @deepractice-ai/agent-service

## 0.2.2

### Patch Changes

- ab2cba8: Restructure docker directory and add AgentRuntime as git submodule
  - @deepractice-ai/agent-config@0.2.2
  - @deepractice-ai/agent-sdk@0.2.2

## 0.2.1

### Patch Changes

- 63814c8: Add Aliyun Container Registry sync and implement lazy session creation
  - Add automatic Docker image synchronization to Aliyun ACR for faster access in China
  - Implement lazy session creation pattern (sessions created on first user message)
  - Fix TypeScript type errors in agent-sdk
  - Update UI with welcome screen and improved session navigation
  - Rename app title to "Deepractice Agent"

- Updated dependencies [63814c8]
  - @deepractice-ai/agent-sdk@0.2.1
  - @deepractice-ai/agent-config@0.2.1

## 0.2.0

### Patch Changes

- bab25d4: Unify session management and fix summary stability issue
  - Add `summary()` method to Session interface for stable session summaries
  - Implement summary generation in ClaudeSession with system message filtering (aligned with Claude Code CLI)
  - Remove HistoricalSession class - all sessions are now ClaudeSession instances
  - ClaudeSession now accepts initialMessages and initialTokenUsage in constructor
  - Remove auto-upgrade logic in SessionManager.getSession()
  - Fix bug where all session summaries changed to "New Session" after creating a new session
  - Simplify SessionManager.deleteSession() to handle all sessions uniformly

- Updated dependencies [ef747fa]
- Updated dependencies [294a88e]
- Updated dependencies [bab25d4]
  - @deepractice-ai/agent-sdk@0.2.0
  - @deepractice-ai/agent-config@0.2.0

## 0.1.2

### Patch Changes

- Updated dependencies [b2f7930]
  - @deepractice-ai/agent-config@0.1.2
  - @deepractice-ai/agent-sdk@0.1.2

## 0.1.1

### Patch Changes

- d5dced5: Test patch release for runtime image build
- Updated dependencies [d5dced5]
  - @deepractice-ai/agent-config@0.1.1
  - @deepractice-ai/agent-sdk@0.1.1

## 0.1.0

### Minor Changes

- 997d45e: First publish

### Patch Changes

- Updated dependencies [997d45e]
  - @deepractice-ai/agent-config@0.1.0
  - @deepractice-ai/agent-sdk@0.1.0
