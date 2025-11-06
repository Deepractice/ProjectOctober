#!/usr/bin/env node
/**
 * Server Entry Point
 * Loads environment files with dotenv, then initializes configuration
 */
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { WebSocketServer } from "ws";
import { config as dotenvConfig } from "dotenv";
import { getConfig } from "@deepractice-ai/agent-config";

import { createApp } from "./app.js";
import { handleChatConnection } from "./websocket/chat.js";
import { handleShellConnection } from "./websocket/shell.js";
import { setupSessionsWatcher } from "./websocket/sessions-broadcast.js";
import { logger } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment files with dotenv
// From src/index.js, monorepo root is 3 levels up
const rootDir = path.resolve(__dirname, "../../..");
const nodeEnv = process.env.NODE_ENV || "development";

// Load in priority order (higher priority = loaded last, overrides earlier)
// 1. .env (defaults)
dotenvConfig({ path: path.join(rootDir, ".env") });

// 2. .env.[environment] (environment-specific)
dotenvConfig({ path: path.join(rootDir, `.env.${nodeEnv}`), override: true });

// 3. .env.local (highest priority - local secrets and overrides)
dotenvConfig({ path: path.join(rootDir, ".env.local"), override: true });

logger.info({ nodeEnv, rootDir }, "Environment files loaded");
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

// Initialize agent-config (reads from process.env, validates, merges sources)
const configInstance = await getConfig();

logger.info("Configuration loaded and validated");
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
  } else if (pathname === "/ws" || pathname === "/") {
    // Accept both /ws and / (root path from dev proxy)
    handleChatConnection(ws, connectedClients);
  } else {
    console.log("❌ Unknown WebSocket path:", pathname);
    ws.close();
  }
});

// Start server
async function startServer() {
  try {
    // Validate PROJECT_PATH before starting
    const projectPath = configInstance.projectPath;
    if (!projectPath) {
      console.error("❌ PROJECT_PATH is not configured in .env");
      console.error("   Please set PROJECT_PATH to a valid directory path");
      process.exit(1);
    }

    // Check if PROJECT_PATH exists, if not create it
    if (!fs.existsSync(projectPath)) {
      console.log(`📁 Creating workspace directory: ${projectPath}`);
      try {
        fs.mkdirSync(projectPath, { recursive: true });
        console.log(`✅ Workspace directory created`);
      } catch (err) {
        console.error(`❌ Failed to create workspace directory: ${projectPath}`);
        console.error(`   Error: ${err.message}`);
        process.exit(1);
      }
    }

    // Verify it's a directory
    const stats = fs.statSync(projectPath);
    if (!stats.isDirectory()) {
      console.error(`❌ PROJECT_PATH is not a directory: ${projectPath}`);
      console.error("   Please set PROJECT_PATH to a valid directory path");
      process.exit(1);
    }

    console.log(`📁 Workspace directory validated: ${projectPath}`);

    // Check if running in production mode (dist folder exists)
    const distIndexPath = path.join(__dirname, "../dist/index.html");
    const isProduction = fs.existsSync(distIndexPath);

    // Log Agent implementation mode
    console.log("🚀 Using Agent Agents SDK for Agent integration");
    console.log(`📦 Running in ${isProduction ? "PRODUCTION" : "DEVELOPMENT"} mode`);

    if (!isProduction) {
      console.log(
        `⚠️  Note: In development, frontend should be served by Vite dev server at http://localhost:5173`
      );
    }

    server.listen(PORT, "0.0.0.0", async () => {
      console.log(`✅ Agent UI server running on http://0.0.0.0:${PORT}`);

      // Start watching session events
      await setupSessionsWatcher(connectedClients);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
