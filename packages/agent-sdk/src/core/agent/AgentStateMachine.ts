import { createMachine, assign, type ActorRefFrom } from "xstate";
import type { AnyMessage } from "~/types";

/**
 * Agent state machine context
 * Tracks current working state of the AI
 */
export interface AgentMachineContext {
  currentMessage?: AnyMessage;
  toolCallId?: string;
  toolName?: string;
  error?: Error;
}

/**
 * Agent state machine events
 */
export type AgentMachineEvent =
  | { type: "USER_MESSAGE"; message: AnyMessage }
  | { type: "AGENT_THINKING" }
  | { type: "AGENT_SPEAKING"; message: AnyMessage }
  | { type: "TOOL_CALL"; toolId: string; toolName: string; input?: any }
  | { type: "TOOL_RESULT"; toolId: string }
  | { type: "RESPONSE_COMPLETE" }
  | { type: "ERROR"; error: Error }
  | { type: "COMPLETE" }
  | { type: "RESET" };

/**
 * Agent state machine
 *
 * Represents what the AI is currently doing:
 * - idle: Waiting for user input
 * - thinking: Processing user message, planning response
 * - speaking: Generating text response
 * - tool_calling: Calling a tool
 * - tool_waiting: Waiting for tool result
 * - error: Something went wrong
 * - completed: Conversation completed
 *
 * This is the user-visible AI state, not the SDK implementation state.
 */
export const createAgentStateMachine = () =>
  createMachine(
    {
      id: "agent",
      initial: "idle",
      context: {
        currentMessage: undefined,
        toolCallId: undefined,
        toolName: undefined,
        error: undefined,
      } satisfies AgentMachineContext,

      states: {
        idle: {
          on: {
            USER_MESSAGE: {
              target: "thinking",
              actions: "setCurrentMessage",
            },
            COMPLETE: "completed",
          },
        },

        thinking: {
          on: {
            AGENT_SPEAKING: {
              target: "speaking",
              actions: "setCurrentMessage",
            },
            TOOL_CALL: {
              target: "tool_calling",
              actions: "setToolCall",
            },
            ERROR: {
              target: "error",
              actions: "setError",
            },
          },
        },

        speaking: {
          on: {
            TOOL_CALL: {
              target: "tool_calling",
              actions: "setToolCall",
            },
            RESPONSE_COMPLETE: {
              target: "idle",
              actions: "clearContext",
            },
            ERROR: {
              target: "error",
              actions: "setError",
            },
          },
        },

        tool_calling: {
          on: {
            TOOL_RESULT: {
              target: "tool_waiting",
            },
            ERROR: {
              target: "error",
              actions: "setError",
            },
          },
        },

        tool_waiting: {
          on: {
            AGENT_THINKING: {
              target: "thinking",
              actions: "clearToolCall",
            },
            AGENT_SPEAKING: {
              target: "speaking",
              actions: ["clearToolCall", "setCurrentMessage"],
            },
            ERROR: {
              target: "error",
              actions: "setError",
            },
          },
        },

        error: {
          on: {
            RESET: {
              target: "idle",
              actions: "clearContext",
            },
            USER_MESSAGE: {
              target: "thinking",
              actions: ["clearError", "setCurrentMessage"],
            },
          },
        },

        completed: {
          type: "final" as const,
        },
      },
    },
    {
      actions: {
        setCurrentMessage: assign({
          currentMessage: ({ event }) => {
            if (event.type === "USER_MESSAGE" || event.type === "AGENT_SPEAKING") {
              return event.message;
            }
            return undefined;
          },
        }),

        setToolCall: assign({
          toolCallId: ({ event }) => (event.type === "TOOL_CALL" ? event.toolId : undefined),
          toolName: ({ event }) => (event.type === "TOOL_CALL" ? event.toolName : undefined),
        }),

        clearToolCall: assign({
          toolCallId: () => undefined,
          toolName: () => undefined,
        }),

        setError: assign({
          error: ({ event }) => (event.type === "ERROR" ? event.error : undefined),
        }),

        clearError: assign({
          error: () => undefined,
        }),

        clearContext: assign({
          currentMessage: () => undefined,
          toolCallId: () => undefined,
          toolName: () => undefined,
          error: () => undefined,
        }),
      },
    }
  );

export type AgentMachine = ReturnType<typeof createAgentStateMachine>;
export type AgentMachineActor = ActorRefFrom<AgentMachine>;
