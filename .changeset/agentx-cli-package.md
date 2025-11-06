---
"@deepractice-ai/agent-cli": minor
"@deepractice-ai/agent-sdk": minor
"@deepractice-ai/agent-service": minor
---

feat: create AgentX CLI package with npm publishing support

Major Changes:
- Create @deepractice-ai/agent-cli package with agentx command
- Configure tsup bundling for agent-service (single file output)
- Configure tsup bundling for agent-cli (with runtime resources)
- Publish @deepractice-ai/agent-sdk to npm
- Publish @deepractice-ai/agent-cli to npm

Features:
- CLI command: agentx http --port 5200 --project ~/path
- Smart path resolution (dev vs production environment)
- Bundled runtime includes service.js and web assets
- Support workspace dependencies with automatic npm resolution

Package Structure:
- agent-cli/dist/runtime/service.js (195KB bundled agent-service)
- agent-cli/dist/runtime/web/ (complete web UI assets)
- agent-sdk published as standalone npm package

Breaking Changes: None
