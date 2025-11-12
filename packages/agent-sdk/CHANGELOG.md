# @deepractice-ai/agent-sdk

## 0.9.0

### Patch Changes

- 296a721: Fix tool execution output duplication issue in WebSocket stream

## 0.8.2

### Patch Changes

- f627796: Fix streaming output and UI bugs
  - Remove fake token counter from AgentStatus component (real-time streaming output makes it unnecessary)
  - Fix duplicate streaming messages by preventing multiple WebSocket connections
  - Add streaming event support to session manager for real-time text updates
  - Improve WebSocket connection management to prevent reconnection loops

- 8a9df83: Fix tool result display and new conversation streaming

  **Tool Result Display**
  - Fixed tool_result messages not being processed in claude-session.ts
  - Tool results now correctly update corresponding tool use messages
  - Added Bash tool result display (removed from hidden list)
  - All tools (WebSearch, Bash, etc.) now show their execution results

  **New Conversation Streaming**
  - Fixed streaming response not displaying for new conversations
  - Frontend now passes tempId to backend in POST /sessions/create
  - Backend uses tempId for streaming events before real session ID is available
  - Streaming events now match frontend's pending session ID
  - Existing conversations continue to work normally (no breaking changes)

  **Technical Changes**
  - Modified transformSDKMessage to handle tool_result blocks and update existing messages
  - Added tempId to SessionCreateOptions interface
  - Session manager now uses frontend tempId for streaming events
  - WebSocket adapter correctly forwards all streaming messages

## 0.8.1

## 0.8.0

## 0.7.0

### Patch Changes

- dabb970: Fix session abort to allow resuming conversation after stopping
  - Change abort() to set session state to 'idle' instead of 'aborted'
  - Remove messageSubject.complete() call in abort() to keep message stream open
  - Session can now continue receiving messages after user clicks Stop button

## 0.6.4

### Patch Changes

- a240812: Fix changeset fixed groups configuration

  Replace wildcard pattern with explicit package names as changeset doesn't support glob patterns in fixed groups.

## 0.6.1

### Patch Changes

- dce9d18: Sync package versions and fix documentation
  - Fix incorrect package name in README installation instructions
  - Sync agent-sdk version to match agent package (0.6.0)
  - Ensure version consistency across fixed package groups

## 0.4.1

### Patch Changes

- 264b5b0: fix: update responsive breakpoint and remove unused agent-config dependency
  - Changed mobile viewport breakpoint from 768px to 1200px in agent-web for better iframe compatibility
  - Removed unused @deepractice-ai/agent-config dependency from agent-sdk
  - Added debug logging for viewport detection

  This fixes the issue where the application doesn't properly switch to mobile layout when embedded in an iframe with width < 1200px, and resolves NPM installation errors when agent-config is not published.

## 0.4.0

### Minor Changes

- d48a4fd: feat: create AgentX CLI package with npm publishing support

  Major Changes:
  - Create @deepractice-ai/agent-cli package with agentx command
  - Configure tsup bundling for agent-service (single file output)
  - Configure tsup bundling for agent-cli (with runtime resources)
  - Publish @deepractice-ai/agent-sdk to npm
  - Publish @deepractice-ai/agent-cli to npm

  Features:
  - CLI command: agentx http --port 5200 --project ~/path
  - Smart path resolution (dev vs production environment)
  - Bundled runtime includes service.js and web assets
  - Support workspace dependencies with automatic npm resolution

  Package Structure:
  - agent-cli/dist/runtime/service.js (195KB bundled agent-service)
  - agent-cli/dist/runtime/web/ (complete web UI assets)
  - agent-sdk published as standalone npm package

  Breaking Changes: None

### Patch Changes

- @deepractice-ai/agent-config@0.4.0

## 0.3.0

### Patch Changes

- @deepractice-ai/agent-config@0.3.0

## 0.2.3

### Patch Changes

- @deepractice-ai/agent-config@0.2.3

## 0.2.2

### Patch Changes

- @deepractice-ai/agent-config@0.2.2

## 0.2.1

### Patch Changes

- 63814c8: Add Aliyun Container Registry sync and implement lazy session creation
  - Add automatic Docker image synchronization to Aliyun ACR for faster access in China
  - Implement lazy session creation pattern (sessions created on first user message)
  - Fix TypeScript type errors in agent-sdk
  - Update UI with welcome screen and improved session navigation
  - Rename app title to "Deepractice Agent"
  - @deepractice-ai/agent-config@0.2.1

## 0.2.0

### Minor Changes

- bab25d4: Unify session management and fix summary stability issue
  - Add `summary()` method to Session interface for stable session summaries
  - Implement summary generation in ClaudeSession with system message filtering (aligned with Claude Code CLI)
  - Remove HistoricalSession class - all sessions are now ClaudeSession instances
  - ClaudeSession now accepts initialMessages and initialTokenUsage in constructor
  - Remove auto-upgrade logic in SessionManager.getSession()
  - Fix bug where all session summaries changed to "New Session" after creating a new session
  - Simplify SessionManager.deleteSession() to handle all sessions uniformly

### Patch Changes

- ef747fa: Enable MCP configuration loading from Claude settings files

  Add settingSources option to automatically load MCP server configurations from:
  - User settings (~/.claude/settings.json)
  - Project settings (.claude/settings.json)
  - Local settings (.claude/settings.local.json)

  This enables full compatibility with Claude CLI and Claude Desktop MCP configurations, allowing users to manage MCP servers using familiar Claude configuration files.

- 294a88e: Filter out SDK warmup sessions from session list

  Automatically filter out Claude SDK warmup/subagent sessions (agent-\* files) from the session manager. These internal SDK sessions are used for performance optimization and should not be exposed to the application layer.

  Changes:
  - Add isWarmupSession() helper to detect agent-\* session IDs
  - Filter warmup sessions during loadHistoricalSessions()
  - Filter warmup sessions in getSessions() output
  - Log skipped warmup sessions for debugging

  This ensures the business layer only sees real user sessions, keeping the SDK implementation details hidden.
  - @deepractice-ai/agent-config@0.2.0

## 0.1.2

### Patch Changes

- Updated dependencies [b2f7930]
  - @deepractice-ai/agent-config@0.1.2

## 0.1.1

### Patch Changes

- d5dced5: Test patch release for runtime image build
- Updated dependencies [d5dced5]
  - @deepractice-ai/agent-config@0.1.1

## 0.1.0

### Minor Changes

- 997d45e: First publish

### Patch Changes

- Updated dependencies [997d45e]
  - @deepractice-ai/agent-config@0.1.0
