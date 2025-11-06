---
"@deepractice-ai/agent-sdk": patch
---

Enable MCP configuration loading from Claude settings files

Add settingSources option to automatically load MCP server configurations from:
- User settings (~/.claude/settings.json)
- Project settings (.claude/settings.json)
- Local settings (.claude/settings.local.json)

This enables full compatibility with Claude CLI and Claude Desktop MCP configurations, allowing users to manage MCP servers using familiar Claude configuration files.
