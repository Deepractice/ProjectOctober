---
"@deepractice-ai/agent-sdk": minor
"@deepractice-ai/agent": minor
---

Add default system prompt for PromptX integration

Improve role activation experience by adding a default system prompt that helps AI understand:

- Current environment uses PromptX MCP server
- Role activation can use short names without specifying "promptx"
- Available PromptX capabilities and functions

This addresses issue #100 where users had to explicitly say "activate promptx XXX role" instead of just "activate XXX role".

**Changes:**

- Add `DEFAULT_SYSTEM_PROMPT` constant with PromptX context
- Update `ClaudeAdapter` to pass `systemPrompt` to SDK
- Add `systemPrompt` field to `AgentConfig` type
- System prompt priority: session option > agent config > default

**Usage:**
Users can now simply say "activate sean" or "activate writer" without specifying the platform name.
