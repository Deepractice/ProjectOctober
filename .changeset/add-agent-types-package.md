---
"@deepractice-ai/agent-types": minor
"@deepractice-ai/agent-sdk": minor
"@deepractice-ai/agent": minor
---

feat: create agent-types package and add multi-modal image support

- Create @deepractice-ai/agent-types as shared type definitions package
- Add ContentBlock[] support for multi-modal messages (text + images)
- Rename AssistantMessage → AgentMessage across entire codebase
- Fix SDK to preserve ContentBlock[] in message history
- Add JSDoc type annotations to backend using agent-types
