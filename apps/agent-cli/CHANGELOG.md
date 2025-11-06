# @deepractice-ai/agent-cli

## 0.4.1

### Patch Changes

- Updated dependencies [264b5b0]
  - @deepractice-ai/agent-sdk@0.4.1

## 0.4.0

### Minor Changes

- d48a4fd: feat: create AgentX CLI package with npm publishing support

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

### Patch Changes

- Updated dependencies [d48a4fd]
  - @deepractice-ai/agent-sdk@0.4.0
