import { Given, When, Then } from "@deepracticex/vitest-cucumber";
import { expect } from "vitest";
import type { TestWorld } from "../support/world";
import type { Session, SessionState } from "~/types/session";

// ============================================================
// Given Steps
// ============================================================

Given("the session state is {string}", function (this: TestWorld, expectedState: string) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();
  expect(session.state).toBe(expectedState);
});

Given("the session is in {string} state", async function (this: TestWorld, expectedState: string) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  // If we need the session to be in "idle" state but it's "created",
  // send a message to transition it
  if (expectedState === "idle" && session.state === "created") {
    await session.send("Hello");
    // Wait for the session to become idle
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  expect(session.state).toBe(expectedState);
});

Given("the session is actively processing", async function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  // Start sending a message but don't wait for it to complete
  // This puts the session in "active" state
  this.testConfig.activePromise = session.send("Tell me a long story about AI");

  // Wait a bit to ensure the session becomes active
  await new Promise((resolve) => setTimeout(resolve, 100));

  expect(session.state).toBe("active");
});

Given("the session is completed", async function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  // Send a message and wait for completion
  await session.send("Hello");

  // Complete the session
  await session.complete();

  expect(session.state).toBe("completed");
});

// ============================================================
// When Steps
// ============================================================

When("I send a message", async function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  // Don't wait for the full response to test state transitions
  this.testConfig.activePromise = session.send("Hello");

  // Give it a moment to start
  await new Promise((resolve) => setTimeout(resolve, 50));
});

When("the response completes", async function (this: TestWorld) {
  // Wait for the message sending to complete
  if (this.testConfig.activePromise) {
    await this.testConfig.activePromise;
  }
});

When("I complete the session", async function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  await session.complete();
});

When("I abort the session", async function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  await session.abort();
});

When("I delete the session", async function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  this.testConfig.deletedSessionId = session.id;
  await session.delete();
});

When("I try to send a message", async function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  try {
    await session.send("This should fail");
    this.testConfig.sendError = undefined;
  } catch (error) {
    this.testConfig.sendError = error as Error;
  }
});

// ============================================================
// Then Steps
// ============================================================

Then("the session state should become {string}", function (this: TestWorld, expectedState: string) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();
  expect(session.state).toBe(expectedState);
});

Then("the session state should be {string}", function (this: TestWorld, expectedState: string) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();
  expect(session.state).toBe(expectedState);
});

Then("I should receive {string} event", function (this: TestWorld, eventType: string) {
  const event = this.receivedEvents.find((e) => e.type === eventType);
  expect(event).toBeDefined();
});

Then("the processing should stop", function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  // After abort, session should be in aborted state
  expect(session.state).toBe("aborted");
});

Then("the session should be removed", function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();
  expect(session.state).toBe("deleted");
});

Then("the session should not be in the agent's session list", function (this: TestWorld) {
  expect(this.agent).toBeDefined();
  expect(this.testConfig.deletedSessionId).toBeDefined();

  const session = this.agent!.getSession(this.testConfig.deletedSessionId!);
  // Deleted sessions should return null
  expect(session).toBeNull();
});

Then("it should throw an error", function (this: TestWorld) {
  expect(this.testConfig.sendError).toBeDefined();
  expect(this.testConfig.sendError!.message).toBeTruthy();
});
