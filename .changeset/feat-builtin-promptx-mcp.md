---
"@deepractice-ai/agent": minor
---

Add built-in PromptX MCP server support and fix MCP tool result display

- Built-in PromptX MCP server configuration using `npx -y @promptx/mcp-server`
- Fix MCP tool result display showing `[object Object]` instead of actual content
- Properly serialize object results from MCP tools to JSON format
