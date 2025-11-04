#!/usr/bin/env node
/**
 * Server Entry Point
 * Loads configuration and starts the Express + WebSocket server
 */
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { WebSocketServer } from "ws";
import { getConfig } from "@deepractice-ai/agent-config";

import { createApp } from "./app.js";
import { handleChatConnection } from "./websocket/chat.js";
import { handleShellConnection } from "./websocket/shell.js";
import { setupSessionsWatcher } from "./watchers/sessions.js";
import sessionManager from "./core/SessionManager.js";
import { getCurrentProject } from "./projects.js";
import { logger } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize configuration
// From src/index.js, monorepo root is 3 levels up: ../../../.env
const envPath = path.resolve(__dirname, "../../../.env");

logger.info({ __dirname, envPath }, "Resolving .env path");
logger.info(
  {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY
      ? `${process.env.ANTHROPIC_API_KEY.substring(0, 6)}***`
      : undefined,
    anthropicBaseUrl: process.env.ANTHROPIC_BASE_URL,
    port: process.env.PORT,
  },
  "Environment variables from process.env"
);

const configInstance = await getConfig({ envPath });

logger.info({ envPath }, "Configuration loaded from file");
logger.info(
  {
    anthropicApiKey: configInstance.anthropicApiKey
      ? `${configInstance.anthropicApiKey.substring(0, 6)}***`
      : undefined,
    anthropicBaseUrl: configInstance.anthropicBaseUrl,
    port: configInstance.port,
  },
  "Final configuration values"
);

// Export config for other modules
export const config = () => configInstance;

const PORT = configInstance.port;

// Track connected WebSocket clients for session updates
const connectedClients = new Set();

// Create HTTP server
const server = http.createServer();

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Create Express app
const app = createApp(wss);

// Attach Express app to HTTP server
server.on("request", app);

// WebSocket connection handler that routes based on URL path
wss.on("connection", (ws, request) => {
  const url = request.url;
  console.log("🔗 Client connected to:", url);

  // Parse URL to get pathname without query parameters
  const urlObj = new URL(url, "http://localhost");
  const pathname = urlObj.pathname;

  if (pathname === "/shell") {
    handleShellConnection(ws);
  } else if (pathname === "/ws") {
    handleChatConnection(ws, connectedClients);
  } else {
    console.log("❌ Unknown WebSocket path:", pathname);
    ws.close();
  }
});

// Start server
async function startServer() {
  try {
    // Check if running in production mode (dist folder exists)
    const distIndexPath = path.join(__dirname, "../dist/index.html");
    const isProduction = fs.existsSync(distIndexPath);

    // Log Agent implementation mode
    console.log("🚀 Using Agent Agents SDK for Agent integration");
    console.log(`📦 Running in ${isProduction ? "PRODUCTION" : "DEVELOPMENT"} mode`);

    if (!isProduction) {
      console.log(
        `⚠️  Note: Requests will be proxied to Vite dev server at http://localhost:${process.env.VITE_PORT || 5173}`
      );
    }

    server.listen(PORT, "0.0.0.0", async () => {
      console.log(`✅ Agent UI server running on http://0.0.0.0:${PORT}`);

      // 🆕 Initialize SessionManager
      const project = getCurrentProject();
      await sessionManager.initialize(project.claudeProjectDir);

      // Start watching the sessions folder for changes
      await setupSessionsWatcher(connectedClients);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
