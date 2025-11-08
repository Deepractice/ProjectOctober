import { createMachine, type ActorRefFrom } from "xstate";

/**
 * Session state machine events
 */
export type SessionMachineEvent =
  | { type: "START" } // First send() call
  | { type: "PAUSE" } // Send complete, back to idle
  | { type: "RESUME" } // Send again
  | { type: "ERROR" } // Error occurred
  | { type: "RETRY" } // Retry after error
  | { type: "COMPLETE" } // User marks complete
  | { type: "DELETE" }; // Delete session

/**
 * Session state machine
 *
 * Represents the lifecycle of the session container:
 * - created: Session just created, no messages yet
 * - active: Session is in use (AI is working)
 * - idle: Session paused, waiting for next send()
 * - completed: User marked session as complete
 * - error: Session encountered error
 * - deleted: Session deleted (terminal state)
 *
 * This is different from Agent state (what AI is doing).
 * Session state is about the container lifecycle.
 */
export const createSessionStateMachine = (sessionId: string) =>
  createMachine({
    id: `session-${sessionId}`,
    initial: "created",

    states: {
      created: {
        on: {
          START: "active",
          DELETE: "deleted",
        },
      },

      active: {
        on: {
          PAUSE: "idle",
          ERROR: "error",
          DELETE: "deleted",
        },
      },

      idle: {
        on: {
          RESUME: "active",
          START: "active", // Alias for resume
          COMPLETE: "completed",
          DELETE: "deleted",
        },
      },

      completed: {
        on: {
          DELETE: "deleted",
        },
      },

      error: {
        on: {
          RETRY: "active",
          DELETE: "deleted",
        },
      },

      deleted: {
        type: "final" as const,
      },
    },
  });

export type SessionMachine = ReturnType<typeof createSessionStateMachine>;
export type SessionMachineActor = ActorRefFrom<SessionMachine>;
