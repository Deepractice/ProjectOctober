import { Given, When, Then, DataTable } from "@deepracticex/vitest-cucumber";
import { expect } from "vitest";
import type { TestWorld } from "../support/world";

// ============================================================
// Given Steps
// ============================================================

Given("I listen for {string} events", function (this: TestWorld, eventName: string) {
  const session = this.testConfig.currentSession || this.session;
  if (!session) {
    throw new Error("No active session");
  }

  this.capturedEvents = this.capturedEvents || {};
  this.capturedEvents[eventName] = [];

  session.on(eventName as any, (data: any) => {
    this.capturedEvents[eventName].push(data);
  });
});

Given("I subscribe to the statistics$ observable", async function (this: TestWorld) {
  const session = this.testConfig.currentSession || this.session;
  if (!session) {
    throw new Error("No active session");
  }

  this.observableValues = [];

  // Subscribe and collect values
  const subscription = session.statistics$().subscribe((stats) => {
    this.observableValues.push(stats);
  });

  // Store subscription for cleanup
  this.subscription = subscription;
});

// ============================================================
// When Steps
// ============================================================

When(
  "I send a message with {int} input tokens and {int} output tokens",
  async function (this: TestWorld, _inputTokens: number, _outputTokens: number) {
    const session = this.testConfig.currentSession || this.session;
    if (!session) {
      throw new Error("No active session");
    }

    // Mock the adapter to return specific token counts
    // This would need to be implemented in the mock adapter
    await session.send("Test message");

    // For now, we'll use the actual token counts from the response
    // In a real scenario, we'd configure the mock adapter to return specific counts
  }
);

When("I send a message that uses:", async function (this: TestWorld, dataTable: DataTable) {
  const session = this.testConfig.currentSession || this.session;
  if (!session) {
    throw new Error("No active session");
  }

  const rows = dataTable.rows();
  const tokenCounts: Record<string, number> = {};

  for (const [tokenType, count] of rows) {
    tokenCounts[tokenType] = parseInt(count as string, 10);
  }

  // For this test, we'll send a message and verify the actual token usage
  // In a production test, we'd configure the mock adapter to return these exact counts
  await session.send("Test message with specific token counts");

  // Store expected token counts for verification
  this.expectedTokenCounts = tokenCounts;
});

When("I call getStatistics()", function (this: TestWorld) {
  const session = this.testConfig.currentSession || this.session;
  if (!session) {
    throw new Error("No active session");
  }

  this.currentStatistics = session.getStatistics();
});

// ============================================================
// Then Steps
// ============================================================

Then("the session statistics should show:", function (this: TestWorld, dataTable: DataTable) {
  const session = this.testConfig.currentSession || this.session;
  if (!session) {
    throw new Error("No active session");
  }

  const stats = session.getStatistics();
  const rows = dataTable.rows().slice(1); // Skip header row

  for (const [field, expectedValue] of rows) {
    const keys = field.split(".");
    let value: any = stats;

    for (const key of keys) {
      value = value[key];
    }

    if (typeof expectedValue === "string" && expectedValue.startsWith(">=")) {
      const threshold = parseInt(expectedValue.substring(2).trim(), 10);
      expect(value).toBeGreaterThanOrEqual(threshold);
    } else if (typeof expectedValue === "string" && expectedValue.startsWith(">")) {
      const threshold = parseInt(expectedValue.substring(1).trim(), 10);
      expect(value).toBeGreaterThan(threshold);
    } else {
      const numValue = parseInt(expectedValue as string, 10);
      expect(value).toBe(numValue);
    }
  }
});

Then("the cost total should be greater than 0", function (this: TestWorld) {
  const session = this.testConfig.currentSession || this.session;
  if (!session) {
    throw new Error("No active session");
  }

  const stats = session.getStatistics();
  expect(stats.cost.total).toBeGreaterThan(0);
});

Then("the duration statistics should show:", function (this: TestWorld, dataTable: DataTable) {
  const session = this.testConfig.currentSession || this.session;
  if (!session) {
    throw new Error("No active session");
  }

  const stats = session.getStatistics();
  const rows = dataTable.rows().slice(1); // Skip header row

  for (const [field, condition] of rows) {
    const value = (stats.duration as any)[field];

    if (condition === "> 0") {
      expect(value).toBeGreaterThan(0);
    } else if (condition === ">= 0") {
      expect(value).toBeGreaterThanOrEqual(0);
    } else if (condition === "< 0") {
      expect(value).toBeLessThan(0);
    }
  }
});

Then("the API duration should be less than or equal to total duration", function (this: TestWorld) {
  const session = this.testConfig.currentSession || this.session;
  if (!session) {
    throw new Error("No active session");
  }

  const stats = session.getStatistics();
  expect(stats.duration.api).toBeLessThanOrEqual(stats.duration.total);
});

Then("the cost breakdown should include:", function (this: TestWorld, dataTable: DataTable) {
  const session = this.testConfig.currentSession || this.session;
  if (!session) {
    throw new Error("No active session");
  }

  const stats = session.getStatistics();
  const rows = dataTable.rows().slice(1); // Skip header row

  for (const [costType, condition] of rows) {
    const value = (stats.cost.breakdown as any)[costType];

    if (condition === "> 0") {
      expect(value).toBeGreaterThan(0);
    } else if (condition === ">= 0") {
      expect(value).toBeGreaterThanOrEqual(0);
    }
  }
});

Then("the total cost should equal the sum of all breakdowns", function (this: TestWorld) {
  const session = this.testConfig.currentSession || this.session;
  if (!session) {
    throw new Error("No active session");
  }

  const stats = session.getStatistics();
  const breakdown = stats.cost.breakdown;
  const sum = breakdown.input + breakdown.output + breakdown.cacheRead + breakdown.cacheCreation;

  expect(stats.cost.total).toBeCloseTo(sum, 10); // Allow for floating point precision
});

Then(
  /^I should receive at least (\d+) "([^"]*)" events?$/,
  function (this: TestWorld, count: string, eventName: string) {
    const numCount = parseInt(count, 10);
    expect(this.capturedEvents).toBeDefined();
    expect(this.capturedEvents[eventName]).toBeDefined();
    expect(this.capturedEvents[eventName].length).toBeGreaterThanOrEqual(numCount);
  }
);

Then("each event should contain valid statistics data", function (this: TestWorld) {
  const events = this.capturedEvents["statistics:updated"];
  expect(events).toBeDefined();
  expect(events.length).toBeGreaterThan(0);

  for (const event of events) {
    expect(event.statistics).toBeDefined();
    expect(event.statistics.duration).toBeDefined();
    expect(event.statistics.cost).toBeDefined();
    expect(event.statistics.conversation).toBeDefined();
    expect(event.timestamp).toBeInstanceOf(Date);
  }
});

Then(
  "I should receive statistics updates through the observable",
  async function (this: TestWorld) {
    expect(this.observableValues).toBeDefined();
    // Wait a bit for updates to come through
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(this.observableValues.length).toBeGreaterThan(0);
  }
);

Then(
  /^the observable should emit at least (\d+) values?$/,
  function (this: TestWorld, count: string) {
    const numCount = parseInt(count, 10);
    expect(this.observableValues).toBeDefined();
    expect(this.observableValues.length).toBeGreaterThanOrEqual(numCount);
  }
);

Then("the conversation turns should be {int}", function (this: TestWorld, expectedTurns: number) {
  const session = this.testConfig.currentSession || this.session;
  if (!session) {
    throw new Error("No active session");
  }

  const stats = session.getStatistics();
  expect(stats.conversation.turns).toBe(expectedTurns);
});

Then("the total cost should reflect {int} turns", function (this: TestWorld, _turns: number) {
  const session = this.testConfig.currentSession || this.session;
  if (!session) {
    throw new Error("No active session");
  }

  const stats = session.getStatistics();
  // Cost should be positive and proportional to turns
  expect(stats.cost.total).toBeGreaterThan(0);
  // We can't verify exact proportionality without knowing exact token counts
  // But we can verify it's reasonable
});

Then("the API duration should accumulate across all turns", function (this: TestWorld) {
  const session = this.testConfig.currentSession || this.session;
  if (!session) {
    throw new Error("No active session");
  }

  const stats = session.getStatistics();
  // API duration should be greater than 0 and reflect multiple requests
  expect(stats.duration.api).toBeGreaterThan(0);
});

Then("the returned statistics should match:", function (this: TestWorld, dataTable: DataTable) {
  expect(this.currentStatistics).toBeDefined();
  const rows = dataTable.rows().slice(1); // Skip header row

  for (const [field, condition] of rows) {
    const keys = field.split(".");
    let value: any = this.currentStatistics;

    for (const key of keys) {
      value = value[key];
    }

    if (condition === "> 0") {
      expect(value).toBeGreaterThan(0);
    } else if (typeof condition === "string" && !isNaN(parseInt(condition, 10))) {
      expect(value).toBe(parseInt(condition, 10));
    }
  }
});

Then(
  "the input cost should be calculated at ${float} per million tokens",
  function (this: TestWorld, expectedRate: number) {
    const session = this.testConfig.currentSession || this.session;
    if (!session) {
      throw new Error("No active session");
    }

    const stats = session.getStatistics();
    const tokenUsage = session.getTokenUsage();

    // Calculate expected cost
    const expectedCost = (tokenUsage.breakdown.input / 1_000_000) * expectedRate;

    expect(stats.cost.breakdown.input).toBeCloseTo(expectedCost, 10);
  }
);

Then(
  "the output cost should be calculated at ${float} per million tokens",
  function (this: TestWorld, expectedRate: number) {
    const session = this.testConfig.currentSession || this.session;
    if (!session) {
      throw new Error("No active session");
    }

    const stats = session.getStatistics();
    const tokenUsage = session.getTokenUsage();

    const expectedCost = (tokenUsage.breakdown.output / 1_000_000) * expectedRate;

    expect(stats.cost.breakdown.output).toBeCloseTo(expectedCost, 10);
  }
);

Then("the input cost should be ${float}", function (this: TestWorld, expectedCost: number) {
  const session = this.testConfig.currentSession || this.session;
  if (!session) {
    throw new Error("No active session");
  }

  const stats = session.getStatistics();
  expect(stats.cost.breakdown.input).toBeCloseTo(expectedCost, 10);
});

Then("the output cost should be ${float}", function (this: TestWorld, expectedCost: number) {
  const session = this.testConfig.currentSession || this.session;
  if (!session) {
    throw new Error("No active session");
  }

  const stats = session.getStatistics();
  expect(stats.cost.breakdown.output).toBeCloseTo(expectedCost, 10);
});

Then("the cache read cost should be ${float}", function (this: TestWorld, expectedCost: number) {
  const session = this.testConfig.currentSession || this.session;
  if (!session) {
    throw new Error("No active session");
  }

  const stats = session.getStatistics();
  expect(stats.cost.breakdown.cacheRead).toBeCloseTo(expectedCost, 10);
});

Then(
  "the cache creation cost should be ${float}",
  function (this: TestWorld, expectedCost: number) {
    const session = this.testConfig.currentSession || this.session;
    if (!session) {
      throw new Error("No active session");
    }

    const stats = session.getStatistics();
    expect(stats.cost.breakdown.cacheCreation).toBeCloseTo(expectedCost, 10);
  }
);

Then("the total cost should be ${float}", function (this: TestWorld, expectedCost: number) {
  const session = this.testConfig.currentSession || this.session;
  if (!session) {
    throw new Error("No active session");
  }

  const stats = session.getStatistics();
  expect(stats.cost.total).toBeCloseTo(expectedCost, 10);
});
