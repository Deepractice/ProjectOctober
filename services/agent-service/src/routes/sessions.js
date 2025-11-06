/**
 * Session API Routes - Using Agent SDK
 */
import express from "express";
import { getAgent } from "../agent.js";

const router = express.Router();

// Create new session
router.post("/create", async (req, res) => {
  try {
    const agent = await getAgent();
    const session = await agent.createSession();

    res.json({
      sessionId: session.id, // Frontend expects sessionId, not id
      id: session.id,
      summary: "New Session",
      messageCount: 0,
      lastActivity: session.createdAt,
      cwd: session.getMetadata().projectPath,
    });
  } catch (error) {
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
      summary: extractSummary(s),
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

function extractSummary(session) {
  const messages = session.getMessages(5);
  const firstUserMsg = messages.find((m) => m.type === "user");

  if (firstUserMsg && firstUserMsg.content) {
    return firstUserMsg.content.substring(0, 100);
  }

  return "New Session";
}

export default router;
