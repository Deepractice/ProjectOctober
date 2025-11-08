import { Before, After } from "@deepracticex/vitest-cucumber";
import type { TestWorld } from "./world";

/**
 * Before Each Scenario
 * Clean up world state before each scenario
 */
Before(function (this: TestWorld) {
  this.resetWorld();
});

/**
 * After Each Scenario
 * Cleanup after scenario completion
 */
After(function (this: TestWorld) {
  // Clean up any resources created during test
  this.agent = undefined;
  this.agentResult = undefined;
});
