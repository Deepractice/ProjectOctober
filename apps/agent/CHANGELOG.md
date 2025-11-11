# @deepractice-ai/agent

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

- Updated dependencies [f627796]
- Updated dependencies [8a9df83]
  - @deepractice-ai/agent-sdk@0.8.2

## 0.8.1

### Patch Changes

- 85c07c2: Fix WebSocket connection stability and prevent rapid reconnect loops
  - Add error event handler to server chat WebSocket to capture connection errors
  - Implement 30-second heartbeat mechanism (server sends ping, client auto-responds with pong)
  - Add 10-second connection timeout to prevent hanging connections
  - Enhance close event logging with code, reason, and wasClean flag for better debugging
  - Adjust reconnection backoff strategy from 2s to 5s initial delay (5s → 10s → 20s → 30s)
  - Improve reconnection attempt logging with progress counter (attempt X/5)

  These changes prevent idle connection drops caused by network intermediaries and eliminate UI stuttering from frequent reconnect cycles. WebSocket connections now remain stable for extended periods.
  - @deepractice-ai/agent-sdk@0.8.1

## 0.8.0

### Minor Changes

- 078d87e: feat: add auto-run feature for Docker containers
  - Add `/api/start-url` endpoint to support automatic prompt execution on startup
  - Add `/auto` route to handle auto-run with prompt and session parameters
  - Support `AUTO_RUN_PROMPT` and `AUTO_RUN_SESSION_ID` environment variables
  - Backend manages one-time auto-run to prevent repeated execution
  - Update Docker configuration and documentation with auto-run examples

### Patch Changes

- @deepractice-ai/agent-sdk@0.8.0

## 0.7.0

### Minor Changes

- c7d426e: Add URL query parameter support for auto-starting sessions with initial prompt

  Users can now start a new session automatically by providing a prompt in the URL query parameter:
  - `http://localhost:5173/?prompt=your-message` will create a new session and send the message
  - The prompt parameter is automatically cleared from the URL after processing
  - Fixed React Strict Mode double execution issue using useRef

### Patch Changes

- Updated dependencies [dabb970]
  - @deepractice-ai/agent-sdk@0.7.0

## 0.6.4

### Patch Changes

- a240812: Fix changeset fixed groups configuration

  Replace wildcard pattern with explicit package names as changeset doesn't support glob patterns in fixed groups.

- Updated dependencies [a240812]
  - @deepractice-ai/agent-sdk@0.6.4

## 0.6.3

### Patch Changes

- ea7bab5: Fix duplicate session rendering in sidebar

  Prevent duplicate session items from appearing when creating a new session by adding duplicate check in addSession method.

## 0.6.2

### Patch Changes

- 91abd32: Fix DiffDisplay crash when loading sessions with Edit/Write tool history

  Fixed a critical bug where the application would crash with "createDiff(...).map is not a function" error when loading historical sessions containing Edit or Write tool calls. The issue was caused by using a stub implementation that returned an empty string instead of properly using the useDiffCalculation hook that returns an array of diff objects.

## 0.6.1

### Patch Changes

- dce9d18: Sync package versions and fix documentation
  - Fix incorrect package name in README installation instructions
  - Sync agent-sdk version to match agent package (0.6.0)
  - Ensure version consistency across fixed package groups

- Updated dependencies [dce9d18]
  - @deepractice-ai/agent-sdk@0.6.1

## 0.6.0

### Minor Changes

- b5c7d21: Update Docker image to use consolidated @deepractice-ai/agent package
  - Changed Dockerfile to install @deepractice-ai/agent instead of deprecated @deepractice-ai/agent-cli
  - The new package includes CLI, server, and web UI in a single distribution
  - Maintains backward compatibility with existing agentx CLI command
