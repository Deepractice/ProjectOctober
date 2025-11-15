import type { Meta, StoryObj } from "@storybook/react";
import { EmptyState } from "./EmptyState";
import { MessageSquare, Inbox, Search, File, Users, Database, FolderOpen } from "lucide-react";
import { Button } from "./Button";

const meta: Meta<typeof EmptyState> = {
  title: "UI/EmptyState",
  component: EmptyState,
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "Title text",
    },
    description: {
      control: "text",
      description: "Description text",
    },
    spacing: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Vertical spacing size",
    },
    icon: {
      control: false,
      description: "Icon element to display",
    },
    action: {
      control: false,
      description: "Action button or element",
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const NoSessions: Story = {
  args: {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "No sessions found",
    description: "Create a new session to get started",
  },
};

export const WithAction: Story = {
  args: {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "No sessions found",
    description: "Create a new session to get started",
    action: (
      <Button size="sm">
        <MessageSquare className="w-4 h-4 mr-2" />
        New Session
      </Button>
    ),
  },
};

export const EmptyInbox: Story = {
  args: {
    icon: <Inbox className="w-6 h-6" />,
    title: "No messages",
    description: "Your inbox is empty. All caught up!",
  },
};

export const SearchNoResults: Story = {
  args: {
    icon: <Search className="w-6 h-6" />,
    title: "No matching results",
    description: "Try adjusting your search term",
  },
  parameters: {
    docs: {
      description: {
        story: "Empty state for search results with no matches",
      },
    },
  },
};

export const NoFiles: Story = {
  args: {
    icon: <File className="w-6 h-6" />,
    title: "No files uploaded",
    description: "Drag and drop files here or click to browse",
    action: <Button variant="outline">Browse Files</Button>,
  },
};

export const NoTeamMembers: Story = {
  args: {
    icon: <Users className="w-6 h-6" />,
    title: "No team members",
    description: "Invite team members to collaborate",
    action: <Button>Invite Members</Button>,
  },
};

export const DatabaseEmpty: Story = {
  args: {
    icon: <Database className="w-6 h-6" />,
    title: "No data available",
    description: "The database is empty. Start by adding some records.",
  },
};

export const EmptyFolder: Story = {
  args: {
    icon: <FolderOpen className="w-6 h-6" />,
    title: "This folder is empty",
    description: "No items to display",
  },
};

export const TitleOnly: Story = {
  args: {
    title: "Nothing here",
  },
  parameters: {
    docs: {
      description: {
        story: "Minimal empty state with title only",
      },
    },
  },
};

export const WithoutIcon: Story = {
  args: {
    title: "No content",
    description: "There is no content available at the moment",
  },
};

export const SmallSpacing: Story = {
  args: {
    icon: <Search className="w-6 h-6" />,
    title: "No results",
    description: "Try a different search query",
    spacing: "sm",
  },
  parameters: {
    docs: {
      description: {
        story: "Compact spacing for tight layouts",
      },
    },
  },
};

export const LargeSpacing: Story = {
  args: {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "Welcome!",
    description: "Get started by creating your first session",
    action: <Button size="lg">Get Started</Button>,
    spacing: "lg",
  },
  parameters: {
    docs: {
      description: {
        story: "Generous spacing for hero/welcome screens",
      },
    },
  },
};

export const AllSpacingSizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="border rounded-lg">
        <h3 className="text-sm font-semibold p-4 border-b">Small Spacing</h3>
        <EmptyState
          icon={<Search className="w-6 h-6" />}
          title="No results"
          description="Compact layout"
          spacing="sm"
        />
      </div>
      <div className="border rounded-lg">
        <h3 className="text-sm font-semibold p-4 border-b">Medium Spacing (Default)</h3>
        <EmptyState
          icon={<Search className="w-6 h-6" />}
          title="No results"
          description="Default layout"
          spacing="md"
        />
      </div>
      <div className="border rounded-lg">
        <h3 className="text-sm font-semibold p-4 border-b">Large Spacing</h3>
        <EmptyState
          icon={<Search className="w-6 h-6" />}
          title="No results"
          description="Generous layout"
          spacing="lg"
        />
      </div>
    </div>
  ),
};

export const MultipleScenarios: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-4">Sessions List</h3>
        <EmptyState
          icon={<MessageSquare className="w-6 h-6" />}
          title="No sessions found"
          description="Create a new session to get started"
          action={<Button size="sm">New Session</Button>}
        />
      </div>
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-4">Search Results</h3>
        <EmptyState
          icon={<Search className="w-6 h-6" />}
          title="No matching results"
          description="Try adjusting your search term"
          spacing="sm"
        />
      </div>
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-4">Inbox</h3>
        <EmptyState
          icon={<Inbox className="w-6 h-6" />}
          title="All caught up!"
          description="Your inbox is empty"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different empty state scenarios in various contexts",
      },
    },
  },
};
