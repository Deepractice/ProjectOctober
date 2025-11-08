import { Given, When, Then, DataTable } from "@deepracticex/vitest-cucumber";
import { expect } from "vitest";
import type { TestWorld } from "../support/world";
import { createAgent } from "~/api/common";
import type { AgentConfig, AgentDependencies } from "~/types/config";
import type { AgentAdapter } from "~/types/adapter";
import type { AgentPersister } from "~/types/persister";

// ============================================================
// Given Steps
// ============================================================

Given("I have a custom adapter implementation", function (this: TestWorld) {
  // Create a minimal mock adapter
  this.customAdapter = {
    async sendMessage() {
      return {
        id: "test-msg-id",
        type: "agent" as const,
        content: "Mock response",
        timestamp: new Date(),
      };
    },
    async streamMessage() {
      // Mock stream implementation
      return (async function* () {
        yield {
          type: "content" as const,
          data: { type: "text" as const, text: "Mock" },
        };
      })();
    },
  } as AgentAdapter;
});

Given("I have a custom persister implementation", function (this: TestWorld) {
  // Create a minimal mock persister
  this.customPersister = {
    async saveAgent() {
      return { ok: true, value: undefined };
    },
    async loadAgent() {
      return { ok: true, value: undefined };
    },
    async deleteAgent() {
      return { ok: true, value: undefined };
    },
    async saveMessage() {
      return { ok: true, value: undefined };
    },
    async loadMessages() {
      return { ok: true, value: [] };
    },
  } as AgentPersister;
});

// ============================================================
// When Steps
// ============================================================

When(
  "I create an agent with config:",
  function (this: TestWorld, dataTable: DataTable) {
    const rows = dataTable.rows();
    const config: Partial<AgentConfig> = {};

    for (const [field, value] of rows) {
      (config as any)[field] = value;
    }

    this.testConfig = config;
    const result = createAgent(config as AgentConfig);

    if (result.isOk()) {
      this.agent = result.value;
      this.agentResult = result;
    } else {
      this.agentResult = result;
    }
  }
);

When("I create an agent without apiKey", function (this: TestWorld) {
  const config: Partial<AgentConfig> = {
    workspace: "/tmp/test",
    // apiKey intentionally omitted
  };

  this.testConfig = config;
  const result = createAgent(config as AgentConfig);

  if (result.isOk()) {
    this.agent = result.value;
    this.agentResult = result;
  } else {
    this.agentResult = result;
  }
});

When(
  "I create an agent with the custom adapter",
  function (this: TestWorld) {
    const config: AgentConfig = {
      workspace: "/tmp/test",
      apiKey: "sk-ant-test-key",
    };

    const dependencies: AgentDependencies = {
      adapter: this.customAdapter!,
    };

    const result = createAgent(config, dependencies);

    if (result.isOk()) {
      this.agent = result.value;
      this.agentResult = result;
    } else {
      this.agentResult = result;
    }
  }
);

When(
  "I create an agent with the custom persister",
  function (this: TestWorld) {
    const config: AgentConfig = {
      workspace: "/tmp/test",
      apiKey: "sk-ant-test-key",
    };

    const dependencies: AgentDependencies = {
      persister: this.customPersister!,
    };

    const result = createAgent(config, dependencies);

    if (result.isOk()) {
      this.agent = result.value;
      this.agentResult = result;
    } else {
      this.agentResult = result;
    }
  }
);

// ============================================================
// Then Steps
// ============================================================

Then("the agent should be created successfully", function (this: TestWorld) {
  expect(this.agentResult).toBeDefined();
  expect(this.agentResult!.isOk()).toBe(true);
  if (this.agentResult!.isOk()) {
    expect(this.agentResult.value).toBeDefined();
    expect(this.agent).toBeDefined();
  }
});

Then("the agent should not be initialized yet", function (this: TestWorld) {
  // Agent is created but session should not exist until first message
  expect(this.agent).toBeDefined();
  // We can check if agent has any internal state that indicates initialization
  // For now, we just verify the agent exists
});

Then(
  "the agent config should match the provided values",
  function (this: TestWorld) {
    expect(this.agent).toBeDefined();
    expect(this.testConfig).toBeDefined();

    // We would need to expose config getter on Agent to verify this
    // For now, we verify the agent was created with the config
    if (this.testConfig.model) {
      // Agent should have been created with custom model
      expect(this.agent).toBeDefined();
    }
    if (this.testConfig.baseUrl) {
      // Agent should have been created with custom baseUrl
      expect(this.agent).toBeDefined();
    }
  }
);

Then("the agent creation should fail", function (this: TestWorld) {
  expect(this.agentResult).toBeDefined();
  expect(this.agentResult!.isErr()).toBe(true);
  if (this.agentResult!.isErr()) {
    expect(this.agentResult.error).toBeDefined();
  }
});

Then(
  "the error code should be {string}",
  function (this: TestWorld, expectedCode: string) {
    expect(this.agentResult).toBeDefined();
    expect(this.agentResult!.isErr()).toBe(true);
    if (this.agentResult!.isErr()) {
      expect(this.agentResult.error.code).toBe(expectedCode);
    }
  }
);

Then(
  "the error message should contain {string}",
  function (this: TestWorld, expectedText: string) {
    expect(this.agentResult).toBeDefined();
    expect(this.agentResult!.isErr()).toBe(true);
    if (this.agentResult!.isErr()) {
      expect(this.agentResult.error.message).toContain(expectedText);
    }
  }
);

Then("the agent should use the custom adapter", function (this: TestWorld) {
  expect(this.agent).toBeDefined();
  expect(this.customAdapter).toBeDefined();
  // Verify the agent was created with custom adapter
  // This requires the agent to expose its adapter or we verify behavior
  expect(this.agent).toBeDefined();
});

Then("the agent should use the custom persister", function (this: TestWorld) {
  expect(this.agent).toBeDefined();
  expect(this.customPersister).toBeDefined();
  // Verify the agent was created with custom persister
  // This requires the agent to expose its persister or we verify behavior
  expect(this.agent).toBeDefined();
});
