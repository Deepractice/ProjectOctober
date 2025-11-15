import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SessionItem } from "./SessionItem";
import type { SessionData } from "./SessionItem";

const meta: Meta<typeof SessionItem> = {
  title: "Session/SessionItem",
  component: SessionItem,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Display a single session in a list. Combines ListItem, TimeAgo, Badge, and AgentLogo. Manages delete loading state internally.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SessionItem>;

const mockSession: SessionData = {
  id: "1",
  summary: "Project Planning Session",
  lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  messageCount: 12,
};

export const Default: Story = {
  args: {
    session: mockSession,
  },
};

export const Selected: Story = {
  args: {
    session: mockSession,
    selected: true,
  },
};

export const Active: Story = {
  args: {
    session: {
      ...mockSession,
      lastActivity: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    },
    active: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Session is active (within last 10 minutes) - shows green pulsing indicator",
      },
    },
  },
};

export const NoMessages: Story = {
  args: {
    session: {
      id: "2",
      summary: "New Session",
      lastActivity: new Date().toISOString(),
      messageCount: 0,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Session with no messages - no badge shown",
      },
    },
  },
};

export const NoSummary: Story = {
  args: {
    session: {
      id: "3",
      lastActivity: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      messageCount: 3,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Session without summary - shows 'New Session' fallback",
      },
    },
  },
};

export const LongSummary: Story = {
  args: {
    session: {
      id: "4",
      summary:
        "Very Long Session Summary That Should Be Truncated With Ellipsis To Prevent Layout Issues",
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      messageCount: 25,
    },
  },
};

export const OldSession: Story = {
  args: {
    session: {
      id: "5",
      summary: "Old Session",
      lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      messageCount: 8,
    },
  },
  parameters: {
    docs: {
      description: {
        story: "Session from over a week ago - shows full date",
      },
    },
  },
};

export const WithDelete: Story = {
  args: {
    session: mockSession,
    onDelete: (id) => console.log("Delete session:", id),
  },
  parameters: {
    docs: {
      description: {
        story: "Hover to see delete button (desktop) or always visible (mobile)",
      },
    },
  },
};

export const WithClickHandler: Story = {
  args: {
    session: mockSession,
    onSelect: (session) => console.log("Selected session:", session.id),
  },
  parameters: {
    docs: {
      description: {
        story: "Clickable session item - check console when clicked",
      },
    },
  },
};

export const MobileMode: Story = {
  args: {
    session: mockSession,
    isMobile: true,
    onDelete: (id) => console.log("Delete:", id),
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
    docs: {
      description: {
        story: "Mobile layout with card style and visible delete button",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [session, setSession] = React.useState(mockSession);
    const [selected, setSelected] = React.useState(false);

    const handleDelete = async (id: string) => {
      console.log("Deleting session:", id);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      alert("Session deleted!");
    };

    return (
      <div className="max-w-md border rounded-lg p-2">
        <SessionItem
          session={session}
          selected={selected}
          onSelect={() => setSelected(!selected)}
          onDelete={handleDelete}
        />
        <div className="mt-4 p-3 bg-muted rounded text-xs">
          <p>Selected: {selected ? "Yes" : "No"}</p>
          <p>Session ID: {session.id}</p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo with select and delete functionality",
      },
    },
  },
};

export const MultipleStates: Story = {
  render: () => (
    <div className="max-w-md space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Default</p>
        <div className="border rounded-lg p-2">
          <SessionItem session={mockSession} />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Selected</p>
        <div className="border rounded-lg p-2">
          <SessionItem session={mockSession} selected />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Active (with indicator)</p>
        <div className="border rounded-lg p-2">
          <SessionItem
            session={{
              ...mockSession,
              lastActivity: new Date().toISOString(),
            }}
            active
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">With delete button</p>
        <div className="border rounded-lg p-2">
          <SessionItem session={mockSession} onDelete={() => {}} />
        </div>
      </div>
    </div>
  ),
};
