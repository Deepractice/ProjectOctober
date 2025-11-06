---
"@deepractice-ai/agent-web": patch
"@deepractice-ai/agent-sdk": patch
---

fix: update responsive breakpoint and remove unused agent-config dependency

- Changed mobile viewport breakpoint from 768px to 1200px in agent-web for better iframe compatibility
- Removed unused @deepractice-ai/agent-config dependency from agent-sdk
- Added debug logging for viewport detection

This fixes the issue where the application doesn't properly switch to mobile layout when embedded in an iframe with width < 1200px, and resolves NPM installation errors when agent-config is not published.
