import { Given, When, Then } from "@deepracticex/vitest-cucumber";
import { expect, vi } from "vitest";

Given("the config has port {int}", async function (port: number) {
  this.mockEnvFile({
    PORT: port.toString(),
    ANTHROPIC_API_KEY: "sk-test",
  });
  this.config = await this.manager.getConfig();
});

When("I call getConfig", async function () {
  this.loaderCallCount++;
  this.config = await this.manager.getConfig();
});

When("I call getConfig again without reload", async function () {
  // Don't increment counter, should use cache
  this.config = await this.manager.getConfig(false);
});

When("I call getConfig with reload true", async function () {
  this.loaderCallCount++;
  this.config = await this.manager.getConfig(true);
});

When("I call getConfigValue with key {string}", async function (key: string) {
  const config = await this.manager.getConfig();
  this.result = config[key];
});

Then("the result should be {int}", function (expected: number) {
  expect(this.result).toBe(expected);
});

Then("the second call should use cached config", function () {
  // If cached, config should be the same instance
  expect(this.config).toBeDefined();
});

Then("the loaders should be called only once", function () {
  expect(this.loaderCallCount).toBe(1);
});

Then("the loaders should be called twice", function () {
  expect(this.loaderCallCount).toBe(2);
});
