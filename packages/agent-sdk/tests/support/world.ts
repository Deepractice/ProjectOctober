import { setWorldConstructor } from "@deepracticex/vitest-cucumber";
import type { Agent } from "~/types/session";
import type { AgentAdapter } from "~/types/adapter";
import type { AgentPersister } from "~/types/persister";
import type { AgentError } from "~/errors/base";

/**
 * Test Configuration Constants
 * Loaded from tests/.env and tests/.env.secret
 */
export const TEST_CONFIG = {
  workspace: process.env.TEST_WORKSPACE || "/tmp/agent-sdk-test",
  apiKey: process.env.AGENT_API_KEY || "sk-ant-test-key-for-bdd-tests",
  baseUrl: process.env.AGENT_BASE_URL || "https://api.anthropic.com",
  dbPath: process.env.TEST_DB_PATH || "/tmp/agent-sdk-test/test.db",
  useMockAdapter: process.env.USE_MOCK_ADAPTER === "true",
} as const;

/**
 * Test World Context
 * Shared context across all BDD scenarios
 */
export interface TestWorld {
  // Agent instance
  agent?: Agent;
  agentResult?: { ok: true; value: Agent } | { ok: false; error: AgentError };

  // Error tracking
  lastError?: Error;

  // Test config
  testConfig: {
    workspace?: string;
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    initError?: Error;
    currentSession?: any;
    customModel?: string;
    quickChatMessage?: string;
    lastMessage?: string;
    imageBlock?: any;
    sentContentBlocks?: any[];
    activePromise?: Promise<void>;
    sendError?: Error;
    deletedSessionId?: string;
    eventListenersSetup?: boolean;
    subscribedToAgent?: boolean;
    subscribedToSession?: boolean;
    specificEventType?: string;
    eventListener?: any;
    observableSubscription?: any;
    sentMessageCount?: number;
    stateTransitions?: string[];
  };

  // Custom implementations
  customAdapter?: AgentAdapter;
  customPersister?: AgentPersister;

  // Event tracking
  receivedEvents: Array<{ type: string; data: any }>;

  // Helpers
  resetWorld(): void;
  waitForEvent(eventType: string, timeout?: number): Promise<any>;
}

setWorldConstructor(function (): TestWorld {
  return {
    agent: undefined,
    agentResult: undefined,

    testConfig: {},

    customAdapter: undefined,
    customPersister: undefined,

    receivedEvents: [],

    resetWorld() {
      this.agent = undefined;
      this.agentResult = undefined;
      this.lastError = undefined;
      this.testConfig = {};
      this.customAdapter = undefined;
      this.customPersister = undefined;
      this.receivedEvents = [];
    },

    async waitForEvent(eventType: string, timeout: number = 5000): Promise<any> {
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        const event = this.receivedEvents.find((e) => e.type === eventType);
        if (event) {
          return event.data;
        }
        // Wait a bit before checking again
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      throw new Error(`Timeout waiting for event: ${eventType}`);
    },
  };
});
