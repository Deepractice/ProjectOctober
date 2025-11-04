import { Given, When, Then, DataTable } from "@deepracticex/vitest-cucumber";
import { expect } from "vitest";

Given("the config manager is initialized", function () {
  if (!this.manager) {
    this.initializeManager();
  }
});

Given("the config mode is {string}", function (mode: string) {
  this.initializeManager(mode as "development" | "runtime");
});

Given("the .env file contains:", function (table: DataTable) {
  const data: Record<string, string> = {};
  table.hashes().forEach((row) => {
    data[row.key] = row.value;
  });
  this.mockEnvFile(data);
});

Given("the database contains:", function (table: DataTable) {
  const data: Record<string, unknown> = {};
  table.hashes().forEach((row) => {
    // Convert key format (CONTEXT_WINDOW -> contextWindow)
    const normalizedKey = row.key
      .toLowerCase()
      .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    // Try to convert to number if possible
    const value = row.value;
    if (!isNaN(Number(value)) && value !== "") {
      data[normalizedKey] = Number(value);
    } else {
      data[normalizedKey] = value;
    }
  });
  this.mockDatabase(data);
});

Given("the UI config contains:", function (table: DataTable) {
  const data: Record<string, unknown> = {};
  table.hashes().forEach((row) => {
    // Convert key format
    const normalizedKey = row.key
      .toLowerCase()
      .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

    // Try to convert to number
    const value = row.value;
    if (!isNaN(Number(value)) && value !== "") {
      data[normalizedKey] = Number(value);
    } else {
      data[normalizedKey] = value;
    }
  });
  this.mockUIConfig(data);
});

Given("the initial config is loaded", async function () {
  // Mock some required config first
  if (!this.envLoader || Object.keys(this.envLoader["data"]).length === 0) {
    this.mockEnvFile({
      PORT: "5201",
      ANTHROPIC_API_KEY: "sk-test-key",
    });
  }
  this.config = await this.manager.getConfig();
});

Given("the current port is {int}", async function (port: number) {
  // Ensure we have minimum config
  if (!this.envLoader || Object.keys(this.envLoader["data"]).length === 0) {
    this.mockEnvFile({
      PORT: port.toString(),
      ANTHROPIC_API_KEY: "sk-test-key",
    });
  }
  this.config = await this.manager.getConfig();
  expect(this.config.port).toBe(port);
});

Given("the config is not loaded yet", function () {
  // Ensure manager is fresh
  this.initializeManager("development");
});

Given("the config is already loaded", async function () {
  this.loaderCallCount++;
  this.config = await this.manager.getConfig();
});

Given("the .env file is updated with PORT {int}", function (port: number) {
  // Update the env loader's data
  this.mockEnvFile({
    PORT: port.toString(),
    ANTHROPIC_API_KEY: "sk-test-key", // Keep required field
  });
});

Given("the database has port {int}", function (port: number) {
  this.mockDatabase({ port });
});

Given("the anthropicApiKey is empty", function () {
  this.mockEnvFile({ ANTHROPIC_API_KEY: "" });
});

Then("the config should have port {int}", function (port: number) {
  expect(this.config).toBeDefined();
  expect(this.config.port).toBe(port);
});

Then("the config should have anthropicApiKey {string}", function (key: string) {
  expect(this.config).toBeDefined();
  expect(this.config.anthropicApiKey).toBe(key);
});

Then("the config should have contextWindow {int}", function (window: number) {
  expect(this.config).toBeDefined();
  expect(this.config.contextWindow).toBe(window);
});

Then("the config should have logLevel {string}", function (level: string) {
  expect(this.config).toBeDefined();
  expect(this.config.logLevel).toBe(level);
});

Then("the config should remain unchanged", async function () {
  const current = await this.manager.getConfig();
  expect(current).toEqual(this.config);
});
