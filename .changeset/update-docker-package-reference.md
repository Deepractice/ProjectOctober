---
"@deepractice-ai/agent": minor
---

Update Docker image to use consolidated @deepractice-ai/agent package

- Changed Dockerfile to install @deepractice-ai/agent instead of deprecated @deepractice-ai/agent-cli
- The new package includes CLI, server, and web UI in a single distribution
- Maintains backward compatibility with existing agentx CLI command
