# Step Definitions Reference

Complete reference of all implemented BDD step definitions for agent-sdk.

## File Organization

### tests/steps/common.steps.ts

Common steps used across multiple features.

**Given:**

- `Given an Agent is initialized`
- `Given a session is created`

---

### tests/steps/agent.steps.ts

Agent-level operations: initialization, quick chat, status, monitoring.

**Given:**

- `Given an Agent is initialized with config:`
- `Given an Agent is created but not initialized`
- `Given an Agent with invalid config:`
- `Given the agent has {int} active sessions`
- `Given {int} sessions are created`
- `Given {int} sessions with conversation history`
- `Given {int} sessions exist`
- `Given {int} sessions are completed`
- `Given the agent has processed multiple sessions`
- `Given I subscribe to agent.sessions$()`

**When:**

- `When I call agent.getStatus()`
- `When I call agent.chat({string})`
- `When I call agent.chat("Explain TypeScript", { model: "claude-opus-4" })`
- `When I try to initialize the agent`
- `When I check agent status`
- `When I call agent.destroy()`
- `When I subscribe to agent.sessions$()`
- `When a new session is created`
- `When a session is created, updated, and deleted`
- `When I call agent.getSessions()`
- `When I call agent.getSessions({int}, {int})`

**Then:**

- `Then I should see:` (DataTable)
- `Then a session should be created automatically`
- `Then the message should be sent`
- `Then I should receive the Session instance`
- `Then I can subscribe to messages$ on returned session`
- `Then the session should use the specified model`
- `Then I can continue the conversation using returned session`
- `Then {int} independent sessions should be created`
- `Then each session should have its own conversation history`
- `Then the session should be created quickly (<1s)`
- `Then warmup pool should refill automatically`
- `Then the agent should remain uninitialized`
- `Then all {int} sessions should be created successfully`
- `Then some should use warm pool`
- `Then some should use cold start`
- `Then no session should fail`
- `Then all sessions should be gracefully closed`
- `Then resources should be released`
- `Then warmup pool should be emptied`
- `Then I can create a new agent instance`
- `Then metrics should include:` (DataTable)
- `Then I should receive an event:` (DocString)
- `Then I should receive events in order:` (DataTable)
- `Then I should see all {int} sessions`
- `Then I can filter by state`
- `Then I should receive {int} sessions starting from offset {int}`

---

### tests/steps/session.steps.ts

Session creation, lifecycle, and warmup pool management.

**Given:**

- `Given warmup pool has {int} ready sessions`
- `Given warmup pool size is {int}`
- `Given warmup pool is exhausted`
- `Given a session is active`
- `Given the session is active`
- `Given the session is active with ongoing response`
- `Given the session exists`
- `Given the session state is {string}`
- `Given the session has {int} messages`
- `Given the session has processed messages`

**When:**

- `When I create a new session`
- `When I create {int} sessions concurrently`
- `When I create a session with options:` (DataTable)
- `When I try to create a session`
- `When I send message {string}`
- `When I subscribe to the session's messages$ stream`
- `When I call session.getMetadata()`
- `When the conversation naturally completes`
- `When I call session.abort()`
- `When I try to send a message`
- `When I call session.delete()`
- `When I call session.getMessages({int}, {int})`
- `When I call session.getTokenUsage()`

**Then:**

- `Then the session should be created within {int}ms`
- `Then the session should be created successfully`
- `Then the session state should be {string}`
- `Then the warmup pool should automatically refill to {int}`
- `Then the warmup pool should refill to {int}`
- `Then the response time should be acceptable`
- `Then the warmup pool should start refilling`
- `Then the first {int} sessions should use warm sessions`
- `Then the remaining {int} sessions should use cold start`
- `Then all {int} sessions should work independently`
- `Then it should throw error {string}`
- `Then the session should be created`
- `Then the session metadata should reflect custom options`
- `Then the session state should change to {string}`
- `Then token usage should be recorded`
- `Then session data should be persisted to disk`
- `Then the session should be read-only`
- `Then the message streaming should stop immediately`
- `Then partial messages should be preserved`
- `Then I can view the conversation history`
- `Then the session should be removed from memory`
- `Then the session files should be deleted from disk`
- `Then I cannot retrieve the session anymore`
- `Then I should receive {int} messages starting from offset {int}`
- `Then messages should be in chronological order`
- `Then I should see total tokens used`
- `Then I should see breakdown by type:` (DataTable)

---

### tests/steps/message-streaming.steps.ts

RxJS message streaming and observable behavior.

**Given:**

- `Given I send a message`
- `Given network connectivity is unstable`

**When:**

- `When I subscribe to the session's messages$ stream`
- `When I subscribe to messages$`
- `When {int} different components subscribe to messages$`
- `When I unsubscribe after {int} seconds`

**Then:**

- `Then I should receive messages in order`
- `Then the stream should complete when response finishes`
- `Then I should receive a user message`
- `Then I should receive an assistant message with thinking`
- `Then I should receive tool messages for file operations`
- `Then I should receive a final assistant message`
- `Then the Observable should emit an error event`
- `Then the error details should be accessible`
- `Then all {int} subscribers should receive the same messages`
- `Then messages should be multicast (not replayed)`
- `Then I should receive partial messages`
- `Then the session should continue processing`
- `Then I can resubscribe to get remaining messages`

---

### tests/steps/error-recovery.steps.ts

Error handling, recovery, and resilience.

**Given:**

- `Given {int} sessions are being created concurrently`

**When:**

- `When the Claude SDK throws an unexpected error`
- `When the network request times out`
- `When the Claude API returns malformed JSON`
- `When the application crashes unexpectedly`
- `When I restart the application`

**Then:**

- `Then the error should be emitted via messages$ Observable`
- `Then other sessions should not be affected`
- `Then I can create new sessions normally`
- `Then the Observable should emit a timeout error`
- `Then the error message should be descriptive`
- `Then the error should be caught and wrapped`
- `Then I can access the raw error details`
- `Then I can reload session data from disk`
- `Then conversation history is preserved`
- `Then I can continue conversations`

---

## Usage Examples

### Basic Session Creation

```gherkin
Given an Agent is initialized
When I create a new session
Then the session should be created successfully
And the session state should be "created"
```

### Quick Chat

```gherkin
Given an Agent is initialized
When I call agent.chat("Hello, who are you?")
Then a session should be created automatically
And the message should be sent
And I should receive the Session instance
```

### Message Streaming

```gherkin
Given an Agent is initialized
And a session is created
When I send message "Explain RxJS in 3 sentences"
And I subscribe to the session's messages$ stream
Then I should receive messages in order
And the stream should complete when response finishes
```

### Error Recovery

```gherkin
Given an Agent is initialized
And a session is active
When the Claude SDK throws an unexpected error
Then the session state should change to "error"
And the error should be emitted via messages$ Observable
And other sessions should not be affected
And I can create new sessions normally
```

### Warmup Pool

```gherkin
Given an Agent is initialized with config:
  | workspace      | /tmp/test |
  | warmupPoolSize | 3         |
  | model          | claude-sonnet-4 |
And warmup pool has 3 ready sessions
When I create a new session
Then the session should be created within 1000ms
And the warmup pool should automatically refill to 3
```

---

## Test Data Formats

### DataTable (rows)

```gherkin
Then I should see breakdown by type:
  | type          |
  | input         |
  | output        |
  | cacheRead     |
  | cacheCreation |
```

### DataTable (rowsHash)

```gherkin
Given an Agent is initialized with config:
  | workspace        | /tmp/test-workspace |
  | warmupPoolSize   | 3                   |
  | model            | claude-sonnet-4     |
```

### DocString (JSON)

```gherkin
Then I should receive an event:
  """json
  {
    "type": "created",
    "session": { "id": "...", "state": "created" }
  }
  """
```

---

## TestWorld Context

All steps have access to the shared TestWorld context via `this`:

```typescript
interface TestWorld {
  // Agent
  agent?: Agent;
  agentConfig: { workspace; warmupPoolSize; model };
  agentStatus?: AgentStatus;

  // Sessions
  currentSession?: Session;
  sessions: Map<string, Session>;
  sessionCreationTime?: number;
  deletedSessionId?: string;
  queriedSessions?: Session[];

  // Messages
  receivedMessages: AnyMessage[];
  sessionEvents: SessionEvent[];
  queriedMessages?: AnyMessage[];
  sessionMetadata?: any;
  tokenUsage?: any;

  // Subscriptions
  subscriptions: Subscription[];

  // Errors
  error?: Error | null;

  // Network
  networkUnstable?: boolean;

  // Async
  pendingSessionCreations?: Promise<Session>[];
}
```

---

## Running Tests

```bash
# All BDD tests
pnpm test:bdd

# Specific feature
pnpm test:bdd features/session-creation.feature

# Specific scenario
pnpm test:bdd features/session-creation.feature:12

# Watch mode
pnpm test:bdd --watch
```

---

## Coverage

- **Total Steps**: 100+
- **Feature Files**: 6
- **Step Files**: 5
- **Coverage**: 100% of scenarios

**Feature Coverage:**

- ✅ session-creation.feature
- ✅ message-streaming.feature
- ✅ quick-chat.feature
- ✅ session-lifecycle.feature
- ✅ error-recovery.feature
- ✅ agent-status.feature
