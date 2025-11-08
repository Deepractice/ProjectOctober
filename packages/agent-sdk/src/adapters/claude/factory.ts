import type { Logger } from "@deepracticex/logger";
import type {
  Session,
  SessionFactory,
  SessionMetadata,
  AgentAdapter,
  SessionOptions,
  MessagePersister,
} from "~/types";
import { ClaudeSession } from "./ClaudeSession";

/**
 * ClaudeSessionFactory - Creates ClaudeSession instances
 *
 * Implements SessionFactory interface for Claude-specific sessions
 */
export class ClaudeSessionFactory implements SessionFactory {
  constructor(private logger: Logger) {}

  createSession(
    id: string,
    metadata: SessionMetadata,
    adapter: AgentAdapter,
    options: SessionOptions,
    persister?: MessagePersister
  ): Session {
    return new ClaudeSession(id, metadata, adapter, options, this.logger, [], undefined, persister);
  }
}
