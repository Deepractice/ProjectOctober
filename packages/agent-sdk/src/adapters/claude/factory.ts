import type { Logger } from "@deepracticex/logger";
import type {
  Session,
  SessionFactory,
  SessionMetadata,
  AgentAdapter,
  SessionOptions,
  AgentPersister,
  AnyMessage,
  TokenUsage,
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
    persister?: AgentPersister,
    initialMessages?: AnyMessage[],
    initialTokenUsage?: TokenUsage
  ): Session {
    return new ClaudeSession(
      id,
      metadata,
      adapter,
      options,
      this.logger,
      persister,
      initialMessages,
      initialTokenUsage
    );
  }
}
