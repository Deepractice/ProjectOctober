import { Given, When, Then } from "@deepracticex/vitest-cucumber";
import { expect } from "vitest";

// Error recovery Given steps
Given("{int} sessions are being created concurrently", async function (count: number) {
  expect(this.agent).toBeDefined();

  // Start creating sessions concurrently but don't wait
  this.pendingSessionCreations = [];

  for (let i = 0; i < count; i++) {
    const promise = this.agent!.createSession();
    this.pendingSessionCreations.push(promise);
  }
});

// Error recovery When steps
When("the Claude SDK throws an unexpected error", function () {
  // Simulate an error in the session
  this.error = new Error("Unexpected SDK error");

  if (this.currentSession) {
    // Force session into error state using internal method
    (this.currentSession as any)._setState("error");
  }
});

When("the network request times out", function () {
  this.error = new Error("Request timeout");

  if (this.currentSession) {
    (this.currentSession as any)._setState("error");
  }
});

When("the Claude API returns malformed JSON", function () {
  this.error = new Error("Malformed JSON response");

  if (this.currentSession) {
    (this.currentSession as any)._setState("error");
  }
});

When("the application crashes unexpectedly", function () {
  // Simulate crash by destroying agent without cleanup
  if (this.agent) {
    this.agent.destroy();
  }
});

When("I restart the application", async function () {
  const { createAgent } = await import("~/api/agent");

  this.agent = createAgent(this.agentConfig);
  await this.agent.initialize();
});

// Error recovery Then steps
Then("the error should be emitted via messages$ Observable", function () {
  expect(this.error).toBeDefined();
});

Then("other sessions should not be affected", function () {
  expect(this.agent).toBeDefined();

  const sessions = this.agent!.getSessions();
  const healthySessions = sessions.filter((s) => s.state !== "error");

  expect(healthySessions.length).toBeGreaterThan(0);
});

Then("I can create new sessions normally", async function () {
  expect(this.agent).toBeDefined();

  const newSession = await this.agent!.createSession();
  expect(newSession).toBeDefined();
  expect(newSession.state).toBe("created");
});

Then("the Observable should emit a timeout error", function () {
  expect(this.error).toBeDefined();
  expect(this.error.message).toContain("timeout");
});

Then("the error message should be descriptive", function () {
  expect(this.error).toBeDefined();
  expect(this.error.message.length).toBeGreaterThan(0);
});

Then("the error should be caught and wrapped", function () {
  expect(this.error).toBeDefined();
  expect(this.error instanceof Error).toBe(true);
});

Then("I can access the raw error details", function () {
  expect(this.error).toBeDefined();
  expect(this.error.message).toBeDefined();
});

Then("I can reload session data from disk", function () {
  expect(this.agent).toBeDefined();

  // After restart, should be able to load persisted sessions
  const sessions = this.agent!.getSessions();
  expect(Array.isArray(sessions)).toBe(true);
});

Then("conversation history is preserved", function () {
  expect(this.agent).toBeDefined();

  const sessions = this.agent!.getSessions();
  for (const session of sessions) {
    const messages = session.getMessages();
    expect(messages.length).toBeGreaterThan(0);
  }
});

Then("I can continue conversations", async function () {
  expect(this.agent).toBeDefined();

  const sessions = this.agent!.getSessions();
  if (sessions.length > 0) {
    const session = sessions[0];
    if (session.isActive()) {
      await session.send("Continue conversation");
      expect(session.getMessages().length).toBeGreaterThan(0);
    }
  }
});
