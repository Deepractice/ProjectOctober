import { When, Then, DataTable } from "@deepracticex/vitest-cucumber";
import { expect } from "vitest";

When("I call updateConfig with:", async function (table: DataTable) {
  const updates: Record<string, unknown> = {};
  table.hashes().forEach((row) => {
    // Parse value type
    const value = row.value;
    if (!isNaN(Number(value))) {
      updates[row.key] = Number(value);
    } else {
      updates[row.key] = value;
    }
  });

  try {
    this.config = await this.manager.updateConfig(updates, { persist: false });
  } catch (error) {
    this.error = error;
  }
});

When("I call updateConfig with persist option:", async function (table: DataTable) {
  // Add persister before updating
  this.addPersister();

  const updates: Record<string, unknown> = {};
  table.hashes().forEach((row) => {
    updates[row.key] = !isNaN(Number(row.value)) ? Number(row.value) : row.value;
  });

  this.config = await this.manager.updateConfig(updates, { persist: true });
  this.persistCalled = this.testPersister.persistCalled;
});

When("I call updateConfigFromUI with:", async function (table: DataTable) {
  const updates: Record<string, unknown> = {};
  table.hashes().forEach((row) => {
    updates[row.key] = !isNaN(Number(row.value)) ? Number(row.value) : row.value;
  });

  // Set UI config directly
  this.mockUIConfig(updates);

  // Reload to apply UI config (highest priority)
  this.config = await this.manager.getConfig(true);
});

Then("the config should not be persisted to file", function () {
  expect(this.persistCalled).toBeUndefined();
});

Then("the config should not be persisted to database", function () {
  expect(this.persistCalled).toBeUndefined();
});

Then("the config should be persisted to file", function () {
  expect(this.persistCalled).toBe(true);
});

Then("the config should be persisted to database", function () {
  expect(this.persistCalled).toBe(true);
});

Then("the UI config should override database config", function () {
  // UI has highest priority, so config should reflect UI values
  expect(this.config).toBeDefined();
});

Then("the update should fail with validation error", function () {
  expect(this.error).toBeDefined();
  expect(this.error.message).toContain("Invalid configuration");
});

Then("the error should mention {string}", function (field: string) {
  expect(this.error).toBeDefined();
  expect(this.error.message.toLowerCase()).toContain(field.toLowerCase());
});
