import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SessionList } from "./SessionList";
import type { SessionData } from "./SessionItem";

const meta: Meta<typeof SessionList> = {
  title: "Session/SessionList",
  component: SessionList,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Display a list of sessions with loading and empty states. Handles filtering by search query and sorting by recent activity.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SessionList>;

const mockSessions: SessionData[] = [
  {
    id: "1",
    summary: "Project Planning Session",
    lastActivity: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    messageCount: 12,
  },
  {
    id: "2",
    summary: "Code Review Meeting",
    lastActivity: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    messageCount: 8,
  },
  {
    id: "3",
    summary: "Design Discussion",
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    messageCount: 5,
  },
  {
    id: "4",
    summary: "Bug Triage",
    lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    messageCount: 3,
  },
  {
    id: "5",
    summary: "Sprint Planning",
    lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    messageCount: 15,
  },
];

export const Default: Story = {
  args: {
    sessions: mockSessions,
  },
};

export const WithSelection: Story = {
  args: {
    sessions: mockSessions,
    selectedId: "2",
  },
};

export const Loading: Story = {
  args: {
    sessions: [],
    isLoading: true,
  },
};

export const Empty: Story = {
  args: {
    sessions: [],
    isLoading: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state when no sessions exist",
      },
    },
  },
};

export const EmptySearchResults: Story = {
  args: {
    sessions: mockSessions,
    searchQuery: "nonexistent query",
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state when search returns no results",
      },
    },
  },
};

export const Filtered: Story = {
  args: {
    sessions: mockSessions,
    searchQuery: "planning",
  },
  parameters: {
    docs: {
      description: {
        story: "Sessions filtered by search query (case-insensitive)",
      },
    },
  },
};

export const WithHandlers: Story = {
  args: {
    sessions: mockSessions,
    selectedId: "1",
    onSelect: (session) => console.log("Selected:", session.id),
    onDelete: (id) => console.log("Delete:", id),
  },
  parameters: {
    docs: {
      description: {
        story: "With click handlers - check console for events",
      },
    },
  },
};

export const MobileMode: Story = {
  args: {
    sessions: mockSessions,
    selectedId: "1",
    isMobile: true,
    onDelete: () => {},
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [sessions, setSessions] = React.useState(mockSessions);
    const [selectedId, setSelectedId] = React.useState<string>("1");
    const [searchQuery, setSearchQuery] = React.useState("");

    const handleDelete = (id: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (selectedId === id) {
        setSelectedId(sessions[0]?.id || "");
      }
    };

    return (
      <div className="h-96 border rounded-lg overflow-hidden">
        <div className="p-3 border-b">
          <input
            type="text"
            placeholder="Search sessions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <SessionList
          sessions={sessions}
          selectedId={selectedId}
          searchQuery={searchQuery}
          onSelect={(session) => setSelectedId(session.id)}
          onDelete={handleDelete}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Fully interactive list with search, select, and delete",
      },
    },
  },
};

export const SortedByRecent: Story = {
  args: {
    sessions: [
      {
        id: "old",
        summary: "Oldest Session",
        lastActivity: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        messageCount: 1,
      },
      {
        id: "recent",
        summary: "Recent Session",
        lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        messageCount: 10,
      },
      {
        id: "middle",
        summary: "Middle Session",
        lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        messageCount: 5,
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: "Sessions are automatically sorted by most recent activity (recent first)",
      },
    },
  },
};

export const ManySessions: Story = {
  args: {
    sessions: Array.from({ length: 20 }, (_, i) => ({
      id: `session-${i}`,
      summary: `Session ${i + 1}`,
      lastActivity: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      messageCount: Math.floor(Math.random() * 20),
    })),
  },
  parameters: {
    docs: {
      description: {
        story: "List with many sessions - scroll to see all",
      },
    },
  },
};
