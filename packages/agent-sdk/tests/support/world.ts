import { setWorldConstructor } from "@deepracticex/vitest-cucumber";
import type { Agent } from "~/types/session";
import type { AgentAdapter } from "~/types/adapter";
import type { AgentPersister } from "~/types/persister";
import type { AgentError } from "~/errors/base";

/**
 * Test World Context
 * Shared context across all BDD scenarios
 */
export interface TestWorld {
  // Agent instance
  agent?: Agent;
  agentResult?: { ok: true; value: Agent } | { ok: false; error: AgentError };

  // Test config
  testConfig: {
    workspace?: string;
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  };

  // Custom implementations
  customAdapter?: AgentAdapter;
  customPersister?: AgentPersister;

  // Helpers
  resetWorld(): void;
}

setWorldConstructor(function (): TestWorld {
  return {
    agent: undefined,
    agentResult: undefined,

    testConfig: {},

    customAdapter: undefined,
    customPersister: undefined,

    resetWorld() {
      this.agent = undefined;
      this.agentResult = undefined;
      this.testConfig = {};
      this.customAdapter = undefined;
      this.customPersister = undefined;
    },
  };
});
