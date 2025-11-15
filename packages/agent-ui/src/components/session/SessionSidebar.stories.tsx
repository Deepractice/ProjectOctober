import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SessionSidebar } from "./SessionSidebar";
import type { SessionData } from "./SessionItem";

const meta: Meta<typeof SessionSidebar> = {
  title: "Session/SessionSidebar",
  component: SessionSidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Complete session management sidebar. Combines Header, SearchBar, and SessionList. Stateless - manages search internally but emits all events.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SessionSidebar>;

// Mock data
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
];

export const Default: Story = {
  args: {
    sessions: mockSessions,
    selectedId: "1",
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
};

export const NoSelection: Story = {
  args: {
    sessions: mockSessions,
  },
};

export const Interactive: Story = {
  render: () => {
    const [sessions, setSessions] = React.useState(mockSessions);
    const [selectedId, setSelectedId] = React.useState<string>("1");
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const handleCreate = () => {
      const newSession: SessionData = {
        id: Date.now().toString(),
        summary: "New Session",
        lastActivity: new Date().toISOString(),
        messageCount: 0,
      };
      setSessions((prev) => [newSession, ...prev]);
      setSelectedId(newSession.id);
    };

    const handleDelete = (id: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (selectedId === id) {
        setSelectedId(sessions[0]?.id || "");
      }
    };

    const handleRefresh = async () => {
      setIsRefreshing(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsRefreshing(false);
    };

    return (
      <div className="h-screen">
        <SessionSidebar
          sessions={sessions}
          selectedId={selectedId}
          onSelect={(session) => setSelectedId(session.id)}
          onDelete={handleDelete}
          onCreate={handleCreate}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Fully interactive demo with create, delete, select, and refresh functionality",
      },
    },
  },
};

export const MobileMode: Story = {
  args: {
    sessions: mockSessions,
    selectedId: "1",
    isMobile: true,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const PWAMode: Story = {
  args: {
    sessions: mockSessions,
    selectedId: "1",
    isMobile: true,
    isPWA: true,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};
