/**
 * Base Agent Event
 *
 * Common fields shared by all agent events.
 */

export interface BaseAgentEvent {
  /** Event UUID */
  uuid: string;

  /** Session ID this event belongs to */
  sessionId: string;

  /** Timestamp when event was created */
  timestamp: number;
}
