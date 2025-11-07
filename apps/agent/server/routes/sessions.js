/**
 * Session API Routes - Using Agent SDK
 *
 * @typedef {import('@deepractice-ai/agent-types').AnyMessage} AnyMessage
 * @typedef {import('@deepractice-ai/agent-types').AgentMessage} AgentMessage
 * @typedef {import('@deepractice-ai/agent-types').UserMessage} UserMessage
 */
import express from "express";
import { getAgent } from "../agent.js";

/** @type {import('express').Router} */
const router = express.Router();

/**
 * Create new session with initial message (lazy session creation)
 *
 * BREAKING CHANGE: message is now REQUIRED in request body
 * Sessions are only created when user sends first message
 */
router.post("/create", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    console.log("🟢 [API] POST /sessions/create", {
      messageLength: message.length,
      messagePreview: message.substring(0, 50) + "...",
    });

    const agent = await getAgent();

    // Create session with initial message - will return real SDK session_id
    const session = await agent.createSession({
      initialMessage: message,
    });

    console.log("🟢 [API] Session created with real SDK session_id:", {
      sessionId: session.id,
      messageCount: session.getMessages().length,
    });

    res.json({
      sessionId: session.id,
      id: session.id,
      summary: session.summary(),
      messages: session.getMessages(), // Return all messages including the first one
      messageCount: session.getMessages().length,
      lastActivity: new Date(),
      cwd: session.getMetadata().projectPath,
    });
  } catch (error) {
    console.error("🟢 [API] Error creating session with message:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get sessions
router.get("/", async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const agent = await getAgent();

    const sessions = agent.getSessions(parseInt(limit), parseInt(offset));

    // Transform to frontend format
    const formatted = sessions.map((s) => ({
      id: s.id,
      summary: s.summary(),
      messageCount: s.getMessages().length,
      lastActivity: s.getMetadata().startTime,
      cwd: s.getMetadata().projectPath,
    }));

    res.json({
      sessions: formatted,
      hasMore: sessions.length === parseInt(limit),
      total: formatted.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get session messages
router.get("/:sessionId/messages", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit, offset = 0 } = req.query;

    console.log("🟣 [API] GET /sessions/:sessionId/messages", {
      sessionId,
      limit,
      offset,
    });

    const agent = await getAgent();
    const session = agent.getSession(sessionId);

    if (!session) {
      console.log("🟣 [API] Session not found:", sessionId);
      return res.status(404).json({ error: "Session not found" });
    }

    const messages = session.getMessages(limit ? parseInt(limit) : undefined, parseInt(offset));

    console.log("🟣 [API] Returning messages:", {
      sessionId,
      messageCount: messages.length,
      messageTypes: messages.map((m) => m.type),
      messageIds: messages.map((m) => m.id),
    });

    res.json({ messages });
  } catch (error) {
    console.error("🟣 [API] Error loading messages:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete session
router.delete("/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const agent = await getAgent();

    await agent.sessionManager.deleteSession(sessionId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get token usage
router.get("/:sessionId/token-usage", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const agent = await getAgent();
    const session = agent.getSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const usage = session.getTokenUsage();

    res.json({
      used: usage.used,
      total: usage.total,
      breakdown: {
        input: usage.breakdown.input,
        cacheCreation: usage.breakdown.cacheCreation,
        cacheRead: usage.breakdown.cacheRead,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
