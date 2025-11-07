/**
 * Express Application Configuration
 * API service with production static file serving
 */
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { config } from "./index.js";
import mcpRoutes from "./routes/mcp.js";
import commandsRoutes from "./routes/commands.js";
import sessionsRoutes from "./routes/sessions.js";
import projectRoutes from "./routes/project.js";
import systemRoutes from "./routes/system.js";
import mediaRoutes from "./routes/media.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Create Express application instance
 * @param {import('ws').WebSocketServer} wss - WebSocket server instance
 * @returns {import('express').Application}
 */
export function createApp(wss) {
  const app = express();

  // Make WebSocket server available to routes
  app.locals.wss = wss;

  // CORS - Allow frontend origin
  app.use(
    cors({
      origin: config().frontendUrl,
      credentials: true,
    })
  );

  // Middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "agent-service" });
  });

  // API Routes (must be before static files)
  app.use("/api/mcp", mcpRoutes);
  app.use("/api/commands", commandsRoutes);
  app.use("/api/sessions", sessionsRoutes);
  app.use("/api/project", projectRoutes);
  app.use("/api", systemRoutes);
  app.use("/api", mediaRoutes);

  // Static files in production
  const webDistPath = path.join(__dirname, "../web");
  const isProduction = config().nodeEnv === "production";

  if (isProduction) {
    console.log("📦 Serving static files from:", webDistPath);

    // Serve static assets with cache
    app.use(
      express.static(webDistPath, {
        maxAge: "1d",
        etag: true,
        index: false, // Don't auto-serve index.html for directory requests
      })
    );

    // SPA fallback for all non-API routes
    app.get("*", (_req, res) => {
      res.sendFile(path.join(webDistPath, "index.html"));
    });
  } else {
    console.log("🔧 Development mode: Proxying to Vite dev server at http://localhost:5173");

    // Development: proxy to Vite dev server
    app.use(async (req, res) => {
      const viteUrl = `http://localhost:5173${req.url}`;
      try {
        const fetch = (await import("node-fetch")).default;
        const response = await fetch(viteUrl, {
          method: req.method,
          headers: req.headers,
        });

        // Copy status and headers
        res.status(response.status);
        response.headers.forEach((value, name) => {
          res.setHeader(name, value);
        });

        // Stream response body
        response.body.pipe(res);
      } catch (error) {
        console.error("❌ Proxy error:", error.message);
        res.status(502).json({
          error: "Vite dev server not available",
          message: "Make sure Vite is running on port 5173",
        });
      }
    });
  }

  return app;
}
