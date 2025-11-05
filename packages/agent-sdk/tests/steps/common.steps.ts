import { Given } from "@deepracticex/vitest-cucumber";
import { createAgent } from "~/api/agent";

// Common step: "Given an Agent is initialized"
Given("an Agent is initialized", async function () {
  this.agent = createAgent(this.agentConfig);
  await this.agent.initialize();
});

// Common step: "Given a session is created"
Given("a session is created", async function () {
  if (!this.agent) {
    this.agent = createAgent(this.agentConfig);
    await this.agent.initialize();
  }
  this.currentSession = await this.agent.createSession();
});
