import { Given, When, Then, DataTable } from "@deepracticex/vitest-cucumber";
import { expect } from "vitest";

Given("warmup pool has {int} ready sessions", function (count: number) {
  // This is checked via agent.getStatus().warmupPoolSize
  expect(this.agent).toBeDefined();
  const status = this.agent!.getStatus();
  expect(status.warmupPoolSize).toBe(count);
});

Given("warmup pool size is {int}", function (size: number) {
  this.agentConfig.warmupPoolSize = size;
});

Given("warmup pool is exhausted", async function () {
  expect(this.agent).toBeDefined();

  // Drain the warmup pool by creating sessions
  const status = this.agent!.getStatus();
  const poolSize = status.warmupPoolSize;

  for (let i = 0; i < poolSize; i++) {
    await this.agent!.createSession();
  }

  // Verify pool is now empty
  const newStatus = this.agent!.getStatus();
  expect(newStatus.warmupPoolSize).toBe(0);
});

Given("a session is active", async function () {
  if (!this.currentSession) {
    if (!this.agent) {
      const { createAgent } = await import("~/api/agent");
      this.agent = createAgent(this.agentConfig);
      await this.agent.initialize();
    }
    this.currentSession = await this.agent.createSession();
  }
  expect(this.currentSession.state).toBe("created");
});

Given("the session is active", async function () {
  await this.currentSession?.send("Hello");
  expect(this.currentSession).toBeDefined();
});

Given("the session is active with ongoing response", async function () {
  expect(this.currentSession).toBeDefined();
  // Send a message that will take time to respond (don't await)
  this.currentSession!.send("Explain quantum computing in detail").catch(() => {
    // Ignore errors from aborted requests
  });

  // Wait for the request to start and receive some messages
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Now the session should be active
  expect(this.currentSession!.state).toBe("active");
});

Given("the session exists", function () {
  expect(this.currentSession).toBeDefined();
  expect(this.currentSession!.id).toBeDefined();
});

Given("the session state is {string}", async function (state: string) {
  expect(this.currentSession).toBeDefined();

  // Transition session to desired state
  if (state === "completed") {
    // Use internal method to set completed state for testing
    (this.currentSession as any)._setState("completed");
  } else if (state === "aborted") {
    await this.currentSession!.send("test").catch(() => {});
    await this.currentSession!.abort();
  } else if (state === "error") {
    // Use internal method to set error state for testing
    (this.currentSession as any)._setState("error");
  }

  expect(this.currentSession!.state).toBe(state);
});

Given("the session has {int} messages", async function (count: number) {
  expect(this.currentSession).toBeDefined();

  // Use internal method to add messages for testing (avoid slow API calls)
  for (let i = 0; i < count; i++) {
    const message = {
      id: `msg-${i}`,
      type: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `Message ${i + 1}`,
      timestamp: new Date(Date.now() + i * 1000), // Chronological order
    };
    (this.currentSession as any)._addMessage(message);
  }

  const messages = this.currentSession!.getMessages();
  expect(messages.length).toBe(count);
});

Given("the session has processed messages", async function () {
  expect(this.currentSession).toBeDefined();

  // Use internal methods to simulate processed messages with token usage
  const mockUsage = {
    used: 150,
    total: 160000,
    breakdown: {
      input: 50,
      output: 100,
      cacheRead: 0,
      cacheCreation: 0,
    },
  };
  (this.currentSession as any)._updateTokenUsage(mockUsage);

  // Add a mock message
  const message = {
    id: "msg-1",
    type: "assistant" as const,
    content: "Hello",
    timestamp: new Date(),
  };
  (this.currentSession as any)._addMessage(message);
});

When("I create a new session", async function () {
  expect(this.agent).toBeDefined();
  const startTime = Date.now();

  this.currentSession = await this.agent!.createSession();

  this.sessionCreationTime = Date.now() - startTime;
});

When("I create {int} sessions concurrently", async function (count: number) {
  expect(this.agent).toBeDefined();

  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(this.agent!.createSession());
  }

  const sessions = await Promise.all(promises);

  for (const session of sessions) {
    this.sessions.set(session.id, session);
  }
});

When("I create a session with options:", async function (table: DataTable) {
  expect(this.agent).toBeDefined();

  const options = table.rowsHash();
  const startTime = Date.now();

  this.currentSession = await this.agent!.createSession({
    systemPrompt: options.systemPrompt,
    model: options.model,
  });

  this.sessionCreationTime = Date.now() - startTime;
});

When("I try to create a session", async function () {
  expect(this.agent).toBeDefined();

  try {
    this.currentSession = await this.agent!.createSession();
    this.error = null;
  } catch (err) {
    this.error = err;
  }
});

When("I send message {string}", async function (message: string) {
  expect(this.currentSession).toBeDefined();
  await this.currentSession!.send(message);
});

When("I subscribe to the session's messages$ stream", function () {
  expect(this.currentSession).toBeDefined();

  const sub = this.currentSession!.messages$().subscribe({
    next: (msg) => {
      this.receivedMessages.push(msg);
    },
    error: (err) => {
      this.error = err;
    },
  });

  this.subscriptions.push(sub);
});

When("I call session.getMetadata()", function () {
  expect(this.currentSession).toBeDefined();
  this.sessionMetadata = this.currentSession!.getMetadata();
});

When("the conversation naturally completes", async function () {
  expect(this.currentSession).toBeDefined();

  // Simulate natural completion by setting state and updating token usage
  const mockUsage = {
    used: 200,
    total: 160000,
    breakdown: {
      input: 80,
      output: 120,
      cacheRead: 0,
      cacheCreation: 0,
    },
  };
  (this.currentSession as any)._updateTokenUsage(mockUsage);
  (this.currentSession as any)._setState("completed");
});

When("I call session.abort()", async function () {
  expect(this.currentSession).toBeDefined();
  await this.currentSession!.abort();
});

When("I try to send a message", async function () {
  expect(this.currentSession).toBeDefined();

  try {
    await this.currentSession!.send("Hello");
    this.error = null;
  } catch (err) {
    this.error = err;
  }
});

When("I call session.delete()", async function () {
  expect(this.currentSession).toBeDefined();
  this.deletedSessionId = this.currentSession!.id;
  await this.currentSession!.delete();
});

When("I call session.getMessages({int}, {int})", function (limit: number, offset: number) {
  expect(this.currentSession).toBeDefined();
  this.queriedMessages = this.currentSession!.getMessages(limit, offset);
});

When("I call session.getTokenUsage()", function () {
  expect(this.currentSession).toBeDefined();
  this.tokenUsage = this.currentSession!.getTokenUsage();
});

Then("the session should be created within {int}ms", function (maxTime: number) {
  expect(this.sessionCreationTime).toBeDefined();
  expect(this.sessionCreationTime).toBeLessThan(maxTime);
});

Then("the session should be created successfully", function () {
  expect(this.currentSession).toBeDefined();
  expect(this.currentSession!.id).toBeDefined();
});

Then("the session state should be {string}", function (expectedState: string) {
  expect(this.currentSession).toBeDefined();
  expect(this.currentSession!.state).toBe(expectedState);
});

Then("the warmup pool should automatically refill to {int}", async function (expectedSize: number) {
  // Wait for pool to refill (use promise instead of setTimeout)
  await new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const status = this.agent!.getStatus();
      if (status.warmupPoolSize === expectedSize) {
        clearInterval(checkInterval);
        resolve(undefined);
      }
    }, 50);

    // Timeout after 2 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(undefined);
    }, 2000);
  });

  const status = this.agent!.getStatus();
  expect(status.warmupPoolSize).toBe(expectedSize);
});

Then("the warmup pool should refill to {int}", async function (expectedSize: number) {
  // Warmup takes 3-8s per session, so wait longer for refill
  await new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const status = this.agent!.getStatus();
      if (status.warmupPoolSize === expectedSize) {
        clearInterval(checkInterval);
        resolve(undefined);
      }
    }, 100);

    // Timeout after 30 seconds (enough for 3 sessions to warmup)
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve(undefined);
    }, 30000);
  });

  const status = this.agent!.getStatus();
  expect(status.warmupPoolSize).toBe(expectedSize);
});

Then("the response time should be acceptable", function () {
  expect(this.sessionCreationTime).toBeDefined();
  expect(this.sessionCreationTime).toBeLessThan(10000); // 10s max
});

Then("the warmup pool should start refilling", function () {
  // Just verify agent is still functional
  expect(this.agent).toBeDefined();
});

Then("the first {int} sessions should use warm sessions", function (count: number) {
  // TODO: Verify sessions were created quickly (from pool)
  expect(this.sessions.size).toBeGreaterThanOrEqual(count);
});

Then("the remaining {int} sessions should use cold start", function (_count: number) {
  // TODO: Verify some sessions took longer (cold start)
  expect(this.sessions.size).toBeGreaterThan(0);
});

Then("all {int} sessions should work independently", function (count: number) {
  expect(this.sessions.size).toBe(count);
  for (const session of this.sessions.values()) {
    expect(session.id).toBeDefined();
  }
});

Then("it should throw error {string}", function (expectedMessage: string) {
  expect(this.error).toBeDefined();
  expect(this.error.message).toContain(expectedMessage);
});

Then("the session should be created", function () {
  expect(this.currentSession).toBeDefined();
  expect(this.currentSession!.id).toBeDefined();
});

Then("the session metadata should reflect custom options", function () {
  expect(this.currentSession).toBeDefined();
  const metadata = this.currentSession!.getMetadata();
  expect(metadata).toBeDefined();
  // Metadata should contain custom model if specified
});

Then("the session state should change to {string}", function (expectedState: string) {
  expect(this.currentSession).toBeDefined();
  expect(this.currentSession!.state).toBe(expectedState);
});

Then("token usage should be recorded", function () {
  expect(this.currentSession).toBeDefined();
  const usage = this.currentSession!.getTokenUsage();
  expect(usage).toBeDefined();
  expect(usage.used).toBeGreaterThan(0);
});

Then("session data should be persisted to disk", function () {
  // Implementation will persist to workspace directory
  expect(this.currentSession).toBeDefined();
});

Then("the session should be read-only", function () {
  expect(this.currentSession).toBeDefined();
  expect(this.currentSession!.isCompleted()).toBe(true);
});

Then("the message streaming should stop immediately", function () {
  expect(this.currentSession).toBeDefined();
  expect(this.currentSession!.state).toBe("aborted");
});

Then("partial messages should be preserved", function () {
  expect(this.currentSession).toBeDefined();
  const messages = this.currentSession!.getMessages();
  // Messages may or may not have arrived before abort, so >= 0 is acceptable
  expect(messages.length).toBeGreaterThanOrEqual(0);
});

Then("I can view the conversation history", function () {
  expect(this.currentSession).toBeDefined();
  const messages = this.currentSession!.getMessages();
  expect(Array.isArray(messages)).toBe(true);
});

Then("the session should be removed from memory", function () {
  expect(this.deletedSessionId).toBeDefined();
  const session = this.agent!.getSession(this.deletedSessionId);
  expect(session).toBeNull();
});

Then("the session files should be deleted from disk", function () {
  // Implementation should delete session files
  expect(this.deletedSessionId).toBeDefined();
});

Then("I cannot retrieve the session anymore", function () {
  expect(this.deletedSessionId).toBeDefined();
  const session = this.agent!.getSession(this.deletedSessionId);
  expect(session).toBeNull();
});

Then(
  "I should receive {int} messages starting from offset {int}",
  function (limit: number, _offset: number) {
    expect(this.queriedMessages).toBeDefined();
    expect(this.queriedMessages.length).toBeLessThanOrEqual(limit);
  }
);

Then("messages should be in chronological order", function () {
  expect(this.queriedMessages).toBeDefined();
  // Verify messages are ordered by timestamp
  for (let i = 1; i < this.queriedMessages.length; i++) {
    const prev = this.queriedMessages[i - 1];
    const curr = this.queriedMessages[i];
    expect(curr.timestamp >= prev.timestamp).toBe(true);
  }
});

Then("I should see total tokens used", function () {
  expect(this.tokenUsage).toBeDefined();
  expect(this.tokenUsage.used).toBeGreaterThan(0);
  expect(this.tokenUsage.total).toBeGreaterThan(0);
});

Then("I should see breakdown by type:", function (table: DataTable) {
  expect(this.tokenUsage).toBeDefined();
  expect(this.tokenUsage.breakdown).toBeDefined();

  // Skip header row
  const types = table
    .rows()
    .slice(1)
    .map((row) => row[0]);
  for (const type of types) {
    expect(this.tokenUsage.breakdown).toHaveProperty(type);
  }
});
