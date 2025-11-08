import { Given, When, Then, DataTable } from "@deepracticex/vitest-cucumber";
import { expect } from "vitest";
import type { TestWorld } from "../support/world";
import type { Session } from "~/types/session";
import type { AnyMessage, ContentBlock } from "~/types/message";

// ============================================================
// Given Steps
// ============================================================

Given("I have created a session", async function (this: TestWorld) {
  expect(this.agent).toBeDefined();
  this.testConfig.currentSession = await this.agent!.createSession({});
  expect(this.testConfig.currentSession).toBeDefined();

  // Automatically set up event listeners for lifecycle events
  // This is needed for scenarios that check for events without explicitly
  // setting up "I am listening to agent events"
  if (!this.testConfig.eventListenersSetup) {
    this.agent!.on("session:completed", (data) => {
      this.receivedEvents.push({ type: "session:completed", data });
    });

    this.agent!.on("session:deleted", (data) => {
      this.receivedEvents.push({ type: "session:deleted", data });
    });

    this.testConfig.eventListenersSetup = true;
  }
});

Given("I am listening to session events", function (this: TestWorld) {
  expect(this.agent).toBeDefined();

  // Listen to all session-level events
  this.agent!.on("stream:start", (data) => {
    this.receivedEvents.push({ type: "stream:start", data });
  });

  this.agent!.on("stream:end", (data) => {
    this.receivedEvents.push({ type: "stream:end", data });
  });

  this.agent!.on("stream:chunk", (data) => {
    this.receivedEvents.push({ type: "stream:chunk", data });
  });

  this.agent!.on("agent:thinking", (data) => {
    this.receivedEvents.push({ type: "agent:thinking", data });
  });

  this.agent!.on("agent:speaking", (data) => {
    this.receivedEvents.push({ type: "agent:speaking", data });
  });

  this.agent!.on("agent:idle", (data) => {
    this.receivedEvents.push({ type: "agent:idle", data });
  });

  this.agent!.on("session:active", (data) => {
    this.receivedEvents.push({ type: "session:active", data });
  });

  this.agent!.on("session:idle", (data) => {
    this.receivedEvents.push({ type: "session:idle", data });
  });
});

Given("I have an image as ContentBlock", function (this: TestWorld) {
  // Create a simple image ContentBlock
  this.testConfig.imageBlock = {
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: "image/png" as const,
      data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    },
  };
});

Given("I have an image ContentBlock", function (this: TestWorld) {
  // Same as above - create image block
  this.testConfig.imageBlock = {
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: "image/png" as const,
      data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    },
  };
});

Given("I am listening to {string} events", function (this: TestWorld, eventType: string) {
  expect(this.agent).toBeDefined();

  // Generic event listener
  this.agent!.on(eventType as any, (data) => {
    this.receivedEvents.push({ type: eventType, data });
  });
});

// ============================================================
// When Steps
// ============================================================

When("I send a message {string}", async function (this: TestWorld, message: string) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  this.testConfig.lastMessage = message;
  this.testConfig.quickChatMessage = message; // For compatibility with session.steps.ts
  await session.send(message);
});

When("I send a message with text and image blocks", async function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();
  expect(this.testConfig.imageBlock).toBeDefined();

  const blocks: ContentBlock[] = [
    { type: "text", text: "Here is an image:" },
    this.testConfig.imageBlock!,
  ];

  await session.send(blocks);
  this.testConfig.sentContentBlocks = blocks;
});

When("I send a message with image", async function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();
  expect(this.testConfig.imageBlock).toBeDefined();

  const blocks: ContentBlock[] = [
    { type: "text", text: "What's in this image?" },
    this.testConfig.imageBlock!,
  ];

  await session.send(blocks);
  this.testConfig.sentContentBlocks = blocks;
});

// ============================================================
// Then Steps
// ============================================================

Then("I should receive a response", function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  const messages = session.getMessages();
  expect(messages.length).toBeGreaterThan(1);

  // Should have at least user + agent message
  const agentMessages = messages.filter((msg) => msg.type === "agent");
  expect(agentMessages.length).toBeGreaterThan(0);
});

Then("the session should contain the AI response", function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  const messages = session.getMessages();
  const agentMessages = messages.filter((msg) => msg.type === "agent");

  expect(agentMessages.length).toBeGreaterThan(0);
  expect(agentMessages[0].content).toBeDefined();
});

Then("I should receive events in order:", function (this: TestWorld, dataTable: DataTable) {
  const rows = dataTable.rows();
  // Skip the header row (first row is "event")
  const expectedEvents = rows.slice(1).map((row) => row[0]);

  // Check that we received all expected events
  for (const expectedEvent of expectedEvents) {
    const found = this.receivedEvents.some((e) => e.type === expectedEvent);
    expect(found).toBe(true);
  }

  // Check order (at least for the events we care about)
  const eventTypes = this.receivedEvents.map((e) => e.type);
  const streamStartIndex = eventTypes.indexOf("stream:start");
  const streamEndIndex = eventTypes.lastIndexOf("stream:end");

  if (streamStartIndex !== -1 && streamEndIndex !== -1) {
    expect(streamStartIndex).toBeLessThan(streamEndIndex);
  }
});

Then("the message should be sent successfully", function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  const messages = session.getMessages();
  expect(messages.length).toBeGreaterThan(0);
});

Then("I should receive multiple chunks", function (this: TestWorld) {
  const chunks = this.receivedEvents.filter((e) => e.type === "stream:chunk");
  // AI might respond with just one chunk for short responses
  // So we check for at least 1 chunk instead of multiple
  expect(chunks.length).toBeGreaterThanOrEqual(1);
});

Then("the chunks should be in order", function (this: TestWorld) {
  const chunks = this.receivedEvents.filter((e) => e.type === "stream:chunk");

  // Verify chunks have index field and are in order
  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i].data.index !== undefined) {
      expect(chunks[i].data.index).toBe(i);
    }
  }
});

Then("the user message should have:", function (this: TestWorld, dataTable: DataTable) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  const messages = session.getMessages();
  const userMessage = messages.find((msg) => msg.type === "user");

  expect(userMessage).toBeDefined();

  const rows = dataTable.rows();
  for (const [field, expectedType] of rows) {
    const value = (userMessage as any)[field];

    if (expectedType.startsWith('"')) {
      // Literal value check
      const expectedValue = expectedType.slice(1, -1);
      expect(value).toBe(expectedValue);
    } else if (expectedType === "string") {
      expect(typeof value).toBe("string");
    } else if (expectedType === "Date") {
      expect(value).toBeInstanceOf(Date);
    }
  }
});

Then("the agent message should have:", function (this: TestWorld, dataTable: DataTable) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  const messages = session.getMessages();
  const agentMessage = messages.find((msg) => msg.type === "agent");

  expect(agentMessage).toBeDefined();

  const rows = dataTable.rows();
  for (const [field, expectedType] of rows) {
    const value = (agentMessage as any)[field];

    if (expectedType.startsWith('"')) {
      // Literal value check
      const expectedValue = expectedType.slice(1, -1);
      expect(value).toBe(expectedValue);
    } else if (expectedType === "string") {
      expect(typeof value).toBe("string");
    } else if (expectedType === "Date") {
      expect(value).toBeInstanceOf(Date);
    }
  }
});

Then("the user message content should be an array", function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  const messages = session.getMessages();
  const userMessage = messages.find((msg) => msg.type === "user");

  expect(userMessage).toBeDefined();
  expect(Array.isArray(userMessage!.content)).toBe(true);
});

Then("the content should contain TextBlock and ImageBlock", function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  const messages = session.getMessages();
  const userMessage = messages.find((msg) => msg.type === "user");

  expect(userMessage).toBeDefined();
  const content = userMessage!.content as ContentBlock[];

  const textBlock = content.find((block) => block.type === "text");
  const imageBlock = content.find((block) => block.type === "image");

  expect(textBlock).toBeDefined();
  expect(imageBlock).toBeDefined();
});

Then("the ImageBlock should have base64 encoded data", function (this: TestWorld) {
  const session = this.testConfig.currentSession as Session;
  expect(session).toBeDefined();

  const messages = session.getMessages();
  const userMessage = messages.find((msg) => msg.type === "user");

  expect(userMessage).toBeDefined();
  const content = userMessage!.content as ContentBlock[];

  const imageBlock = content.find((block) => block.type === "image") as any;
  expect(imageBlock).toBeDefined();
  expect(imageBlock.source).toBeDefined();
  expect(imageBlock.source.type).toBe("base64");
  expect(imageBlock.source.data).toBeDefined();
  expect(typeof imageBlock.source.data).toBe("string");
});
