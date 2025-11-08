/**
 * SessionFactory - Factory for creating Session instances with DI
 *
 * Sessions need runtime parameters (id, metadata, options), so we use
 * Factory Pattern instead of direct DI injection.
 */

import { injectable, inject } from "tsyringe";
import type { Logger } from "@deepracticex/logger";
import type {
  Session,
  SessionMetadata,
  SessionOptions,
  AgentAdapter,
  AgentPersister,
  AnyMessage,
  TokenUsage,
} from "~/types";
import { Session as BaseSession } from "./BaseSession";

@injectable()
export class SessionFactory {
  constructor(
    @inject("AgentAdapter") private adapter: AgentAdapter,
    @inject("AgentPersister") private persister: AgentPersister,
    @inject("Logger") private logger: Logger
  ) {}

  create(
    id: string,
    metadata: SessionMetadata,
    options: SessionOptions = {},
    initialMessages: AnyMessage[] = [],
    initialTokenUsage?: TokenUsage
  ): Session {
    return new BaseSession(
      id,
      metadata,
      this.adapter,
      options,
      this.logger,
      this.persister,
      initialMessages,
      initialTokenUsage
    );
  }
}
