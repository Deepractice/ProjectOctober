/**
 * Session API Routes
 * Handles session listing, creation, messages, deletion, and token usage
 */

import express from "express";
import path from "path";
import os from "os";
import { promises as fs } from "fs";
import { getCurrentProject, getSessions } from "../projects.js";
import { getSessionMessages, deleteSession } from "../sessions.js";
import { warmupSession } from "../agent-sdk.js";
import sessionManager from "../core/SessionManager.js";

const router = express.Router();

// Get sessions for current project
router.get("/", async (req, res) => {
  try {
    const { limit = 5, offset = 0 } = req.query;
    const result = await getSessions(parseInt(limit), parseInt(offset));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new session with warmup
router.post("/create", async (req, res) => {
  try {
    console.log("📝 Creating new session via warmup...");

    const project = getCurrentProject();
    const projectPath = project.fullPath;

    // Call warmup to create session
    const sessionId = await warmupSession(projectPath);

    console.log("✅ Session created successfully:", sessionId);

    // Register warmup session with SessionManager
    sessionManager.createSession(sessionId, {
      cwd: projectPath,
      command: "Warmup",
      timestamp: new Date().toISOString(),
      isWarmup: true,
    });
    console.log("📝 Warmup session registered with SessionManager:", sessionId);

    res.json({
      success: true,
      sessionId: sessionId,
      project: {
        name: project.name,
        path: project.path,
      },
    });
  } catch (error) {
    console.error("❌ Error creating session:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a specific session
router.get("/:sessionId/messages", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit, offset } = req.query;

    // Parse limit and offset if provided
    const parsedLimit = limit ? parseInt(limit, 10) : null;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    const result = await getSessionMessages(sessionId, parsedLimit, parsedOffset);

    // Handle both old and new response formats
    if (Array.isArray(result)) {
      // Backward compatibility: no pagination parameters were provided
      res.json({ messages: result });
    } else {
      // New format with pagination info
      res.json(result);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete session endpoint
router.delete("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    await deleteSession(sessionId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get token usage for a specific session
router.get("/:sessionId/token-usage", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const homeDir = os.homedir();

    // Get actual project path
    const project = getCurrentProject();
    const projectPath = project.fullPath;

    // Construct the JSONL file path
    const encodedPath = projectPath.replace(/[\\/:\s~_]/g, "-");
    const projectDir = path.join(homeDir, ".claude", "projects", encodedPath);

    // Allow only safe characters in sessionId
    const safeSessionId = String(sessionId).replace(/[^a-zA-Z0-9._-]/g, "");
    if (!safeSessionId) {
      return res.status(400).json({ error: "Invalid sessionId" });
    }
    const jsonlPath = path.join(projectDir, `${safeSessionId}.jsonl`);

    // Constrain to projectDir
    const rel = path.relative(path.resolve(projectDir), path.resolve(jsonlPath));
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      return res.status(400).json({ error: "Invalid path" });
    }

    // Read and parse the JSONL file
    let fileContent;
    try {
      fileContent = await fs.readFile(jsonlPath, "utf8");
    } catch (error) {
      if (error.code === "ENOENT") {
        return res.status(404).json({ error: "Session file not found", path: jsonlPath });
      }
      throw error;
    }
    const lines = fileContent.trim().split("\n");

    const parsedContextWindow = parseInt(process.env.CONTEXT_WINDOW, 10);
    const contextWindow = Number.isFinite(parsedContextWindow) ? parsedContextWindow : 160000;
    let inputTokens = 0;
    let cacheCreationTokens = 0;
    let cacheReadTokens = 0;

    // Find the latest assistant message with usage data (scan from end)
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const entry = JSON.parse(lines[i]);

        // Only count assistant messages which have usage data
        if (entry.type === "assistant" && entry.message?.usage) {
          const usage = entry.message.usage;

          // Use token counts from latest assistant message only
          inputTokens = usage.input_tokens || 0;
          cacheCreationTokens = usage.cache_creation_input_tokens || 0;
          cacheReadTokens = usage.cache_read_input_tokens || 0;

          break;
        }
      } catch (parseError) {
        // Skip lines that can't be parsed
        continue;
      }
    }

    // Calculate total context usage (excluding output_tokens)
    const totalUsed = inputTokens + cacheCreationTokens + cacheReadTokens;

    res.json({
      used: totalUsed,
      total: contextWindow,
      breakdown: {
        input: inputTokens,
        cacheCreation: cacheCreationTokens,
        cacheRead: cacheReadTokens,
      },
    });
  } catch (error) {
    console.error("Error reading session token usage:", error);
    res.status(500).json({ error: "Failed to read session token usage" });
  }
});

export default router;
