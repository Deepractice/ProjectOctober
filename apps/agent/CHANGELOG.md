# @deepractice-ai/agent

## 0.6.1

### Patch Changes

- dce9d18: Sync package versions and fix documentation
  - Fix incorrect package name in README installation instructions
  - Sync agent-sdk version to match agent package (0.6.0)
  - Ensure version consistency across fixed package groups

- Updated dependencies [dce9d18]
  - @deepractice-ai/agent-sdk@0.6.1

## 0.6.0

### Minor Changes

- b5c7d21: Update Docker image to use consolidated @deepractice-ai/agent package
  - Changed Dockerfile to install @deepractice-ai/agent instead of deprecated @deepractice-ai/agent-cli
  - The new package includes CLI, server, and web UI in a single distribution
  - Maintains backward compatibility with existing agentx CLI command
