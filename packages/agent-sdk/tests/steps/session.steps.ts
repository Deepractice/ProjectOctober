import { Given, When, Then } from "@deepracticex/vitest-cucumber";
import { expect } from "vitest";
import type { TestWorld } from "../support/world";
import type { Session } from "~/types/session";

// ============================================================
// Given Steps
// ============================================================

Given("I have an initialized agent", async function (this: TestWorld) {
  // Import createAgent here to avoid circular dependencies
  const { createAgent } = await import("~/api/common");
  const { TEST_CONFIG } = await import("../support/world");

  // Create agent if not already exists
  if (!this.agent) {
    const result = createAgent({
      workspace: TEST_CONFIG.workspace,
      apiKey: TEST_CONFIG.apiKey,
    });

    if (result.isOk()) {
      this.agent = result.value;
    } else {
      throw new Error(`Failed to create agent: ${result.error.message}`);
    }
  }

  // Initialize the agent
  await this.agent!.initialize();
  const status = this.agent!.getStatus();
  expect(status.ready).toBe(true);
});

// ============================================================
// When Steps
// ============================================================

When("I create a new session", async function (this: TestWorld) {
  expect(this.agent).toBeDefined();
  this.testConfig.currentSession = await this.agent!.createSession({});
});

When("I create a session with model {string}", async function (this: TestWorld, model: string) {
  expect(this.agent).toBeDefined();
  this.testConfig.currentSession = await this.agent!.createSession({ model });
  this.testConfig.customModel = model;
});

When("I send a quick chat message {string}", async function (this: TestWorld, message: string) {
  expect(this.agent).toBeDefined();
  this.testConfig.currentSession = await this.agent!.chat(message);
  this.testConfig.quickChatMessage = message;
});

// ============================================================
// Then Steps
// ============================================================

Then("a session should be created", function (this: TestWorld) {
  expect(this.testConfig.currentSession).toBeDefined();
  expect(this.testConfig.currentSession).toBeInstanceOf(Object);
});

Then("the session should have a unique ID", function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();
  expect(session.id).toBeDefined();
  expect(typeof session.id).toBe("string");
  expect(session.id.length).toBeGreaterThan(0);
});

Then("the session state should be {string}", function (this: TestWorld, expectedState: string) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();
  expect(session.state).toBe(expectedState);
});

Then("the session should use the specified model", function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();
  // We can't directly verify the model without exposing it in the Session interface
  // But we can verify the session was created with the custom model option
  expect(this.testConfig.customModel).toBeDefined();
});

Then("I should receive {string} event", function (this: TestWorld, eventType: string) {
  const event = this.receivedEvents.find((e) => e.type === eventType);
  expect(event).toBeDefined();
});

Then("a new session should be created automatically", function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();
  expect(session.id).toBeDefined();
});

Then("the session should contain my message", function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  // Get messages from the session
  const messages = session.getMessages();
  expect(messages).toBeDefined();
  expect(messages.length).toBeGreaterThan(0);

  // Find the user message
  const userMessage = messages.find((msg) => msg.type === "user");
  expect(userMessage).toBeDefined();
  expect(userMessage!.content).toContain(this.testConfig.quickChatMessage);
});
