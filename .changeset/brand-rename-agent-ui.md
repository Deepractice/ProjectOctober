---
"@project-october/agent-ui": minor
---

Complete brand rename from Claude Code UI to Agent UI

## Changes

Brand refresh that renames all user-facing "Claude" references to "Agent" to better reflect the product's multi-AI-platform nature.

### User-Facing Changes

**Brand Identity**

- Product name: `Claude Code UI` → `Agent UI`
- CLI command: `claude-code-ui` → `agent-ui`
- Package name: `@project-october/claudecodeui` → `@project-october/agent-ui`
- All UI text, titles, and descriptions updated

**Technical Changes**

- WebSocket message types renamed:
  - `claude-command` → `agent-command`
  - `claude-response` → `agent-response`
  - `claude-complete` → `agent-complete`

**File Renames**

- `claude-sdk.js` → `agent-sdk.js`
- `ClaudeLogo.tsx` → `AgentLogo.tsx`
- `ClaudeStatus.tsx` → `AgentStatus.tsx`
- `ClaudeStatusBar.tsx` → `AgentStatusBar.tsx`
- `claude-ai-icon.svg` → `agent-ai-icon.svg`
- `claude-call-flow.md` → `agent-call-flow.md`

### What's Preserved

- `@anthropic-ai/claude-agent-sdk` package dependency (required)
- `~/.claude/` configuration directory paths (technical convention)
- Anthropic documentation links

## Impact

- 58 files modified
- All documentation updated
- Docker configuration updated
- Repository URLs updated to deepractice/ProjectOctober
- Homepage updated to agent-ui.deepractice.ai

## Migration Guide

If you have existing installations:

1. Uninstall old package: `npm uninstall -g @project-october/claudecodeui`
2. Install new package: `npm install -g @project-october/agent-ui`
3. Update any scripts or references from `claude-code-ui` to `agent-ui`
