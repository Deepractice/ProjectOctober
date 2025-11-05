import { Observable } from "rxjs";
import type { Session, SessionState, SessionMetadata, TokenUsage, AnyMessage } from "~/types";

/**
 * HistoricalSession - Read-only session loaded from JSONL files
 *
 * Used for displaying conversation history.
 * Cannot send messages or subscribe to streams.
 */
export class HistoricalSession implements Session {
  public readonly id: string;
  public readonly createdAt: Date;
  private messages: AnyMessage[];
  private metadata: SessionMetadata;
  private tokenUsage: TokenUsage;

  constructor(
    id: string,
    messages: AnyMessage[],
    metadata: SessionMetadata,
    tokenUsage: TokenUsage
  ) {
    this.id = id;
    this.messages = messages;
    this.metadata = metadata;
    this.tokenUsage = tokenUsage;
    this.createdAt = metadata.startTime;
  }

  get state(): SessionState {
    return "completed";
  }

  async send(_content: string): Promise<void> {
    throw new Error(
      "Cannot send message to historical session. Use agent.createSession({ resume: id }) to continue."
    );
  }

  async abort(): Promise<void> {
    throw new Error("Cannot abort historical session");
  }

  async complete(): Promise<void> {
    throw new Error("Historical session is already completed");
  }

  async delete(): Promise<void> {
    throw new Error("Use agent.deleteSession(id) to delete historical sessions");
  }

  messages$(): Observable<AnyMessage> {
    throw new Error("Cannot subscribe to historical session. Use getMessages() instead.");
  }

  getMessages(limit?: number, offset = 0): AnyMessage[] {
    const end = limit ? offset + limit : undefined;
    return this.messages.slice(offset, end);
  }

  getTokenUsage(): TokenUsage {
    return { ...this.tokenUsage };
  }

  getMetadata(): SessionMetadata {
    return { ...this.metadata };
  }

  isActive(): boolean {
    return false;
  }

  isCompleted(): boolean {
    return true;
  }
}
