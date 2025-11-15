/**
 * System Initialization Event
 *
 * Emitted when agent session starts.
 * Contains configuration and environment info.
 *
 * Aligned with: SDKSystemMessage (subtype: 'init') from @anthropic-ai/claude-agent-sdk
 */

import type { BaseAgentEvent } from "./BaseAgentEvent";

export interface SystemInitEvent extends BaseAgentEvent {
  type: "system";
  subtype: "init";
  model: string;
  tools: string[];
  cwd: string;
}
