import type { AgentAdapter } from "../../src/types/adapter";
import { MockAdapter } from "./MockAdapter";
import { TEST_CONFIG } from "./world";

/**
 * Create adapter based on environment configuration
 *
 * If USE_MOCK_ADAPTER=true, uses MockAdapter (fast, no API costs)
 * Otherwise uses real ClaudeAdapter (requires valid API key)
 */
export function createTestAdapter(): AgentAdapter {
  if (TEST_CONFIG.useMockAdapter) {
    // Use MockAdapter for fast tests without API calls
    return new MockAdapter();
  }

  // Use real ClaudeAdapter (dynamically imported to avoid loading if not needed)
  // Note: This requires AGENT_API_KEY in tests/.env.secret
  throw new Error(
    "Real ClaudeAdapter not implemented yet. Set USE_MOCK_ADAPTER=true in tests/.env"
  );
}
