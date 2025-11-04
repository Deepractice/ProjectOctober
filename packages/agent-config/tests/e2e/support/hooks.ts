import { Before, After, BeforeAll, AfterAll } from "@deepracticex/vitest-cucumber";

BeforeAll(async function () {
  // Global setup if needed
  console.log("Starting agent-config tests...");
});

Before(async function () {
  // Reset state before each scenario
  this.cleanupMocks();
  this.manager = undefined;
  this.config = undefined;
  this.validationResult = undefined;
});

After(async function () {
  // Cleanup after each scenario
  this.cleanupMocks();
});

AfterAll(async function () {
  // Global cleanup
  console.log("agent-config tests completed");
});
