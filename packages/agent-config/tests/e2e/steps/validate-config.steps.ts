import { When, Then, DataTable } from "@deepracticex/vitest-cucumber";
import { expect } from "vitest";
import { validateConfig } from "../../../src/api/validateConfig.js";
import { baseConfigSchema } from "../../../src/core/schemas/base.js";

When("I validate config:", function (table: DataTable) {
  const config: Record<string, unknown> = {};
  table.hashes().forEach((row) => {
    const value = row.value;
    // Parse value type
    if (!isNaN(Number(value))) {
      config[row.key] = Number(value);
    } else if (value === "") {
      config[row.key] = "";
    } else {
      config[row.key] = value;
    }
  });

  this.validationResult = validateConfig(config);

  // If valid, store the data (validateConfig doesn't return data, need to parse again)
  if (this.validationResult.valid) {
    // Apply defaults by parsing with schema
    this.validationResult.data = baseConfigSchema.parse(config);
  }
});

Then("the validation should succeed", function () {
  expect(this.validationResult).toBeDefined();
  expect(this.validationResult.valid).toBe(true);
});

Then("the validation should fail", function () {
  expect(this.validationResult).toBeDefined();
  expect(this.validationResult.valid).toBe(false);
});

Then("the validation errors should mention {string}", function (field: string) {
  expect(this.validationResult).toBeDefined();
  expect(this.validationResult.valid).toBe(false);
  expect(this.validationResult.errors).toBeDefined();

  const mentioned = this.validationResult.errors.some(
    (err: any) =>
      err.path.toLowerCase().includes(field.toLowerCase()) ||
      err.message.toLowerCase().includes(field.toLowerCase())
  );
  expect(mentioned).toBe(true);
});

Then("the result should be valid", function () {
  expect(this.validationResult.valid).toBe(true);
});

Then("the result should have port {int}", function (port: number) {
  expect(this.validationResult.data).toBeDefined();
  expect(this.validationResult.data.port).toBe(port);
});

Then("the result should have vitePort {int}", function (vitePort: number) {
  expect(this.validationResult.data).toBeDefined();
  expect(this.validationResult.data.vitePort).toBe(vitePort);
});

Then("the result should have contextWindow {int}", function (contextWindow: number) {
  expect(this.validationResult.data).toBeDefined();
  expect(this.validationResult.data.contextWindow).toBe(contextWindow);
});
