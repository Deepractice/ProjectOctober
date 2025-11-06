---
"@deepractice-ai/agent-web": patch
"@deepractice-ai/agent-sdk": patch
"@deepractice-ai/agent-service": patch
---

Add Aliyun Container Registry sync and implement lazy session creation

- Add automatic Docker image synchronization to Aliyun ACR for faster access in China
- Implement lazy session creation pattern (sessions created on first user message)
- Fix TypeScript type errors in agent-sdk
- Update UI with welcome screen and improved session navigation
- Rename app title to "Deepractice Agent"
