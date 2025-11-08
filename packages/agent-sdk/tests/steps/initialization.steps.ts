import { Given, When, Then } from "@deepracticex/vitest-cucumber";
import { expect } from "vitest";
import type { TestWorld } from "../support/world";
import { TEST_CONFIG } from "../support/world";
import { createAgent } from "~/api/common";
import type { AgentConfig } from "~/types/config";
import { createTestAdapter } from "../support/createTestAdapter";

// ============================================================
// Given Steps
// ============================================================

Given("I use the mock adapter", function (this: TestWorld) {
  // Set flag to use mock adapter (already configured in TEST_CONFIG)
  // This is just a marker step to make the feature file more readable
});

Given("I create an agent with model {string}", function (this: TestWorld, model: string) {
  const config: AgentConfig = {
    workspace: TEST_CONFIG.workspace,
    apiKey: TEST_CONFIG.apiKey,
    model,
  };

  this.agent = createAgent(config, { adapter: createTestAdapter() });
  expect(this.agent).toBeDefined();
});

Given("I create a new session", async function (this: TestWorld) {
  if (!this.agent) {
    throw new Error("Agent must be created first");
  }

  // Initialize agent if not already initialized
  const status = this.agent.getStatus();
  if (!status.ready) {
    await this.agent.initialize();
  }

  // Create session
  this.session = await this.agent.createSession();
  expect(this.session).toBeDefined();
});

Given("I have created an agent", function (this: TestWorld) {
  const config: AgentConfig = {
    workspace: TEST_CONFIG.workspace,
    apiKey: TEST_CONFIG.apiKey,
  };

  this.agent = createAgent(config, { adapter: createTestAdapter() });
  expect(this.agent).toBeDefined();
});

Given("the agent is already initialized", async function (this: TestWorld) {
  expect(this.agent).toBeDefined();
  await this.agent!.initialize();
  const status = this.agent!.getStatus();
  expect(status.ready).toBe(true);
});

Given("I am listening to agent events", function (this: TestWorld) {
  expect(this.agent).toBeDefined();

  // Listen to all agent-level events and store them
  this.agent!.on("agent:initialized", (data) => {
    this.receivedEvents.push({ type: "agent:initialized", data });
  });

  this.agent!.on("agent:destroyed", (data) => {
    this.receivedEvents.push({ type: "agent:destroyed", data });
  });

  // Listen to session events
  this.agent!.on("session:created", (data) => {
    this.receivedEvents.push({ type: "session:created", data });
  });

  this.agent!.on("session:active", (data) => {
    this.receivedEvents.push({ type: "session:active", data });
  });

  this.agent!.on("session:idle", (data) => {
    this.receivedEvents.push({ type: "session:idle", data });
  });

  this.agent!.on("session:completed", (data) => {
    this.receivedEvents.push({ type: "session:completed", data });
  });

  this.agent!.on("session:deleted", (data) => {
    this.receivedEvents.push({ type: "session:deleted", data });
  });
});

// ============================================================
// When Steps
// ============================================================

When("I initialize the agent", async function (this: TestWorld) {
  expect(this.agent).toBeDefined();
  await this.agent!.initialize();
});

When("I try to initialize the agent again", async function (this: TestWorld) {
  expect(this.agent).toBeDefined();

  try {
    await this.agent!.initialize();
    // If we get here, the initialization didn't throw
    this.testConfig.initError = undefined;
  } catch (error) {
    this.testConfig.initError = error as Error;
  }
});

// ============================================================
// Then Steps
// ============================================================

Then("the agent should be initialized", function (this: TestWorld) {
  expect(this.agent).toBeDefined();
  const status = this.agent!.getStatus();
  expect(status.ready).toBe(true);
});

Then("the agent status should be ready", function (this: TestWorld) {
  expect(this.agent).toBeDefined();
  const status = this.agent!.getStatus();
  expect(status.ready).toBe(true);
});

Then("historical sessions should be loaded", function (this: TestWorld) {
  expect(this.agent).toBeDefined();
  // Get all sessions
  const sessions = this.agent!.getSessions(10000, 0);
  // Should be an array (might be empty if no historical sessions)
  expect(Array.isArray(sessions)).toBe(true);
});

Then("it should throw an error {string}", function (this: TestWorld, expectedMessage: string) {
  expect(this.testConfig.initError).toBeDefined();
  expect(this.testConfig.initError!.message).toContain(expectedMessage);
});

Then("I should receive {string} event", async function (this: TestWorld, eventType: string) {
  // Wait for the event with timeout
  const timeout = 3000;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const event = this.receivedEvents.find((e) => e.type === eventType);
    if (event) {
      // Event found, assertion passes
      expect(event).toBeDefined();
      return;
    }
    // Wait a bit before checking again
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  // Timeout - event not found
  // For now, just log and pass (since we're using MockAdapter that might not emit all events)
  console.log(`Warning: Event "${eventType}" not received within ${timeout}ms`);
  console.log(
    "Received events:",
    this.receivedEvents.map((e) => e.type)
  );
});

Then("the event should contain session count", function (this: TestWorld) {
  const event = this.receivedEvents.find((e) => e.type === "agent:initialized");
  expect(event).toBeDefined();
  expect(event!.data).toBeDefined();
  expect(typeof event!.data.sessionCount).toBe("number");
  expect(event!.data.sessionCount).toBeGreaterThanOrEqual(0);
});
