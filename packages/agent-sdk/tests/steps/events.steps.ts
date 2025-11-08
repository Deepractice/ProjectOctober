import { Given, When, Then } from "@deepracticex/vitest-cucumber";
import { expect } from "vitest";
import type { TestWorld } from "../support/world";
import type { Session } from "~/types/session";
import type { Subscription } from "rxjs";

// ============================================================
// Given Steps
// ============================================================

Given("I subscribe to all agent events", function (this: TestWorld) {
  expect(this.agent).toBeDefined();

  // Subscribe to all major agent events
  const events = [
    "session:created",
    "session:active",
    "session:idle",
    "session:completed",
    "session:deleted",
    "message:user",
    "message:agent",
    "agent:thinking",
    "agent:speaking",
    "agent:idle",
    "stream:start",
    "stream:chunk",
    "stream:end",
  ];

  events.forEach((eventType) => {
    this.agent!.on(eventType as any, (data) => {
      this.receivedEvents.push({ type: eventType, data });
    });
  });

  this.testConfig.subscribedToAgent = true;
});

Given("I subscribe to session events only", function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  // Subscribe to session-level events only
  const events = [
    "message:user",
    "message:agent",
    "agent:thinking",
    "agent:speaking",
    "stream:start",
    "stream:chunk",
    "stream:end",
  ];

  events.forEach((eventType) => {
    session.on(eventType as any, (data) => {
      this.receivedEvents.push({ type: eventType, data });
    });
  });

  this.testConfig.subscribedToSession = true;
});

Given("I subscribe to {string} events", function (this: TestWorld, eventType: string) {
  expect(this.agent).toBeDefined();

  this.agent!.on(eventType as any, (data) => {
    this.receivedEvents.push({ type: eventType, data });
  });

  this.testConfig.specificEventType = eventType;
});

Given("I am subscribed to session events", function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  // Subscribe and keep track of the listener function
  this.testConfig.eventListener = (data: any) => {
    this.receivedEvents.push({ type: "message:agent", data });
  };

  session.on("message:agent", this.testConfig.eventListener);
  this.testConfig.subscribedToSession = true;
});

Given("I subscribe to the session messages observable", function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  // Subscribe to the messages$ observable
  const subscription = session.messages$().subscribe({
    next: (message) => {
      this.receivedEvents.push({ type: "observable:message", data: message });
    },
    error: (err) => {
      console.error("Observable error:", err);
    },
  });

  this.testConfig.observableSubscription = subscription;
});

// ============================================================
// When Steps
// ============================================================

When("I create a session and send a message", async function (this: TestWorld) {
  expect(this.agent).toBeDefined();

  // Create a new session
  const newSession = await this.agent!.createSession({});

  // Send a message
  await newSession.send("Hello from new session");
});

When("I send a message in this session", async function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  await session.send("Hello in this session");
});

When("I send a message", async function (this: TestWorld) {
  // If no current session exists, create one
  if (!this.testConfig.currentSession && this.agent) {
    this.testConfig.currentSession = await this.agent.createSession({});
  }

  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  await session.send("Test message");
});

When("I unsubscribe from events", function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();
  expect(this.testConfig.eventListener).toBeDefined();

  // Remove the specific listener
  session.off("message:agent", this.testConfig.eventListener);

  // Clear the received events to track new events after unsubscribe
  this.receivedEvents = [];
});

When("I send multiple messages", async function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  // Send first message
  await session.send("First message");

  // Send second message
  await session.send("Second message");

  this.testConfig.sentMessageCount = 2;
});

// ============================================================
// Then Steps
// ============================================================

Then("I should receive events from all sessions", function (this: TestWorld) {
  // Should have received events from the new session
  expect(this.receivedEvents.length).toBeGreaterThan(0);

  // Should have message events
  const messageEvents = this.receivedEvents.filter(
    (e) =>
      e.type.startsWith("message:") || e.type.startsWith("agent:") || e.type.startsWith("stream:")
  );
  expect(messageEvents.length).toBeGreaterThan(0);
});

Then("events should include session IDs", function (this: TestWorld) {
  // Some events should have sessionId in their data
  const eventsWithSessionId = this.receivedEvents.filter((e) => e.data?.sessionId);

  // At least some events should include session IDs
  // (not all events have sessionId, but session lifecycle events should)
  expect(eventsWithSessionId.length).toBeGreaterThan(0);
});

Then("I should only receive this session's events", function (this: TestWorld) {
  // All received events should be from session-level subscriptions
  expect(this.receivedEvents.length).toBeGreaterThan(0);

  // Verify we got message-related events
  const messageEvents = this.receivedEvents.filter(
    (e) => e.type.startsWith("message:") || e.type.startsWith("agent:")
  );
  expect(messageEvents.length).toBeGreaterThan(0);
});

Then("I should only receive speaking events", function (this: TestWorld) {
  const speakingEvents = this.receivedEvents.filter((e) => e.type === "agent:speaking");
  expect(speakingEvents.length).toBeGreaterThan(0);

  // All events should be speaking events
  const allAreSpeaking = this.receivedEvents.every((e) => e.type === "agent:speaking");
  expect(allAreSpeaking).toBe(true);
});

Then("I should not receive other event types", function (this: TestWorld) {
  const specificType = this.testConfig.specificEventType;
  expect(specificType).toBeDefined();

  // All events should be of the specific type
  const allAreSpecificType = this.receivedEvents.every((e) => e.type === specificType);
  expect(allAreSpecificType).toBe(true);
});

Then("I should not receive any more events", function (this: TestWorld) {
  // After unsubscribing and clearing events, we should not receive new events
  const messageEvents = this.receivedEvents.filter((e) => e.type === "message:agent");
  expect(messageEvents.length).toBe(0);
});

Then("I should receive all messages in the stream", function (this: TestWorld) {
  const observableMessages = this.receivedEvents.filter((e) => e.type === "observable:message");

  // Should have received user and agent messages from both sends
  // Each send creates a user message and receives agent messages
  expect(observableMessages.length).toBeGreaterThan(0);

  // Should have at least as many messages as we sent (user + agent responses)
  const sentCount = this.testConfig.sentMessageCount || 0;
  expect(observableMessages.length).toBeGreaterThanOrEqual(sentCount);
});

Then("the stream should maintain order", function (this: TestWorld) {
  const observableMessages = this.receivedEvents.filter((e) => e.type === "observable:message");

  // Messages should be in order - user messages should come before their agent responses
  // Find user messages
  const userMessages = observableMessages.filter((e) => e.data.type === "user");
  expect(userMessages.length).toBeGreaterThan(0);

  // Find agent messages
  const agentMessages = observableMessages.filter((e) => e.data.type === "agent");
  expect(agentMessages.length).toBeGreaterThan(0);

  // First message should be a user message
  expect(observableMessages[0].data.type).toBe("user");
});
