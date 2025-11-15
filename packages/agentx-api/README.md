# @deepractice-ai/agentx-api

Public API interface definitions for the AgentX ecosystem.

## Overview

**AgentX API** provides TypeScript interfaces, event types, and factory functions for building AI agents powered by Claude.

## Architecture

This package follows a clean separation of concerns:

```
agentx-api/
├── interfaces/   # API contracts (Agent, AgentFactory, etc.)
├── events/       # Event type definitions (aligned with official SDK)
└── functions/    # Factory functions (placeholders, implemented in core)
```

## Installation

```bash
pnpm add @deepractice-ai/agentx-api
```

## Quick Start

```typescript
import { createAgentFactory, type AgentConfig } from "@deepractice-ai/agentx-api";

// Create factory
const factory = createAgentFactory();

// Configure agent
const config: AgentConfig = {
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: "claude-3-5-sonnet-20241022",
  systemPrompt: "You are a helpful assistant",
};

// Create agent
const agent = factory.createAgent(config);

// Promise-based API
const result = await agent.send("What is TypeScript?");
console.log(result.message.content);

// Event-based API
agent.on("assistant", (event) => {
  console.log(event.message.content);
});

agent.on("stream_event", (event) => {
  if (event.delta?.type === "text_delta") {
    process.stdout.write(event.delta.text);
  }
});

await agent.send("Write a story", { stream: true });
```

## Core Concepts

### Agent

A stateful conversation instance:

- Maintains message history
- Emits real-time events
- Supports streaming responses

### Events

Event types aligned with `@anthropic-ai/claude-agent-sdk`:

- `user` - User message received
- `assistant` - Assistant message completed
- `stream_event` - Streaming delta (text/thinking)
- `result` - Final result with statistics
- `system` - System initialization

### Configuration

Reusable, stateless configuration:

- API credentials
- Model selection
- System prompts
- Tool definitions

## Event-Driven Architecture

```typescript
// Listen for specific events
agent.on("assistant", (event) => {
  console.log("Assistant:", event.message.content);
});

agent.on("stream_event", (event) => {
  if (event.streamEventType === "content_block_delta") {
    console.log("Delta:", event.delta);
  }
});

agent.on("result", (event) => {
  if (event.subtype === "success") {
    console.log("Cost:", event.totalCostUsd);
  }
});

// Listen to all events
agent.onAny((event) => {
  console.log("Event:", event.type, event);
});
```

## Design Philosophy

1. **Type Safety** - Full TypeScript support with discriminated unions
2. **SDK Alignment** - Events aligned with official Claude Agent SDK
3. **Clean Separation** - Interfaces, events, and functions organized by purpose
4. **One Type Per File** - Easy navigation and AI-friendly structure

## API Reference

### Interfaces

- `Agent` - Core agent interface
- `AgentFactory` - Factory for creating agents
- `AgentConfig` - Agent configuration
- `AgentState` - Serializable state
- `SendOptions` - Per-request options
- `SendResult` - Response result
- `Tool` - Tool definition

### Events

- `AgentEvent` - Union of all events
- `UserMessageEvent`
- `AssistantMessageEvent`
- `StreamDeltaEvent`
- `ResultEvent`
- `SystemInitEvent`

### Functions

- `createAgentFactory()` - Create agent factory

## License

MIT
