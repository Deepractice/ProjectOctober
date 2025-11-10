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
 * Create new session (message is OPTIONAL)
 * Supports two modes:
 * 1. Empty session: { summary?: string } - Creates empty session for later messaging
 * 2. Session with message: { message: string } - Creates session and sends first message
 */
router.post("/create", async (req, res) => {
  try {
    const { message, summary } = req.body;

    console.log("🟢 [API] POST /sessions/create", {
      hasMessage: !!message,
      summary: summary || "New conversation",
    });

    const agent = await getAgent();

    // Create session (with or without initial message)
    const session = await agent.createSession({
      summary: summary || "New conversation",
      model: "claude-sonnet-4",
      ...(message && { initialMessage: message }),
    });

    console.log("🟢 [API] Session created:", {
      sessionId: session.id,
      messageCount: session.getMessages().length,
    });

    res.json({
      sessionId: session.id,
      id: session.id,
      summary: session.summary(),
      messages: session.getMessages(),
      messageCount: session.getMessages().length,
      lastActivity: new Date(),
      cwd: session.getMetadata().projectPath,
    });
  } catch (error) {
    console.error("🟢 [API] Error creating session:", error);
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

    // 🖼️ IMAGE TRACKING: Log image data in messages
    const userMessagesWithImages = messages.filter((m) => {
      if (m.type !== "user") return false;
      const content = m.content;
      return Array.isArray(content) && content.some((b) => b.type === "image");
    });

    console.log("🟣 [API] Returning messages:", {
      sessionId,
      messageCount: messages.length,
      messageTypes: messages.map((m) => m.type),
      messageIds: messages.map((m) => m.id),
      userMessages: messages.filter((m) => m.type === "user").length,
      userMessagesWithImages: userMessagesWithImages.length,
    });

    console.log("🖼️ [IMAGE-TRACK] Message details:", {
      sessionId,
      messages: messages.map((m) => ({
        id: m.id,
        type: m.type,
        contentType: typeof m.content,
        isArray: Array.isArray(m.content),
        hasImages:
          m.type === "user" &&
          Array.isArray(m.content) &&
          m.content.some((b) => b.type === "image"),
        imageCount:
          m.type === "user" && Array.isArray(m.content)
            ? m.content.filter((b) => b.type === "image").length
            : 0,
      })),
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
