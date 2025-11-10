/**
 * Agent SDK singleton instance
 * Manages Claude agent lifecycle and sessions
 */
import { createAgent } from "@deepractice-ai/agent-sdk/server";
import { logger } from "./utils/logger.js";
import { config } from "./index.js";

let agentInstance = null;

/**
 * Get or create Agent singleton
 */
export async function getAgent() {
  if (!agentInstance) {
    const appConfig = config();

    if (!appConfig.projectPath) {
      throw new Error("PROJECT_PATH not configured");
    }

    if (!appConfig.anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    logger.info("🤖 Creating Agent instance");
    logger.info(`   Workspace: ${appConfig.projectPath}`);
    logger.info(`   Base URL: ${appConfig.anthropicBaseUrl}`);

    agentInstance = createAgent({
      workspace: appConfig.projectPath,
      apiKey: appConfig.anthropicApiKey,
      baseUrl: appConfig.anthropicBaseUrl,
      model: "claude-sonnet-4",
    });

    logger.info("🔥 Initializing Agent (loading historical sessions)...");
    await agentInstance.initialize();

    const status = agentInstance.getStatus();
    logger.info("✅ Agent initialized");
    logger.info(`   Active sessions: ${status.activeSessions}`);
  }

  return agentInstance;
}

/**
 * Destroy Agent instance (for shutdown)
 */
export function destroyAgent() {
  if (agentInstance) {
    logger.info("🛑 Destroying Agent instance");
    agentInstance.destroy();
    agentInstance = null;
  }
}
