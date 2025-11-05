import { setWorldConstructor } from "@deepracticex/vitest-cucumber";
import type { Agent, Session, AgentStatus, SessionEvent, AnyMessage } from "~/types";
import type { Subscription } from "rxjs";

/**
 * TestWorld - shared context for BDD tests
 */
export interface TestWorld {
  // Agent state
  agent?: Agent;
  agentConfig: {
    workspace: string;
    warmupPoolSize: number;
    model: string;
  };
  agentStatus?: AgentStatus;

  // Session state
  currentSession?: Session;
  sessions: Map<string, Session>;
  sessionCreationTime?: number;
  deletedSessionId?: string;
  queriedSessions?: Session[];

  // Message state
  receivedMessages: AnyMessage[];
  sessionEvents: SessionEvent[];
  queriedMessages?: AnyMessage[];
  sessionMetadata?: any;
  tokenUsage?: any;

  // Subscription tracking
  subscriptions: Subscription[];

  // Error tracking
  error?: Error | null;

  // Network simulation
  networkUnstable?: boolean;

  // Async operations
  pendingSessionCreations?: Promise<Session>[];

  // Test utilities
  cleanup(): Promise<void>;
}

setWorldConstructor(function (): TestWorld {
  // Use workspace from hooks (loaded from config)
  const testWorkspace = (global as any).__TEST_WORKSPACE__ || "/tmp/test-workspace";

  return {
    agentConfig: {
      workspace: testWorkspace,
      warmupPoolSize: 3,
      model: "claude-haiku-4-5-20251001", // Use fastest model for tests
    },
    sessions: new Map(),
    receivedMessages: [],
    sessionEvents: [],
    subscriptions: [],

    async cleanup() {
      // Unsubscribe from all subscriptions
      for (const sub of this.subscriptions) {
        sub.unsubscribe();
      }
      this.subscriptions = [];

      // Clean up agent
      if (this.agent) {
        this.agent.destroy();
        this.agent = undefined;
      }

      // Clear state
      this.sessions.clear();
      this.receivedMessages = [];
      this.sessionEvents = [];
      this.currentSession = undefined;
      this.error = undefined;
    },
  };
});
