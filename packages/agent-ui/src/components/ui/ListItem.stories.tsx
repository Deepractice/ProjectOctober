import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ListItem } from "./ListItem";
import {
  Clock,
  Trash2,
  MessageSquare,
  User,
  File,
  Folder,
  Mail,
  Download,
  Edit,
  Star,
} from "lucide-react";
import { Badge } from "./Badge";
import { TimeAgo } from "./TimeAgo";
import { AgentLogo } from "./AgentLogo";

const meta: Meta<typeof ListItem> = {
  title: "UI/ListItem",
  component: ListItem,
  tags: ["autodocs"],
  argTypes: {
    selected: {
      control: "boolean",
      description: "Whether the item is selected",
    },
    active: {
      control: "boolean",
      description: "Whether the item is active",
    },
    showActiveIndicator: {
      control: "boolean",
      description: "Show active indicator dot",
    },
    variant: {
      control: "select",
      options: ["default", "compact"],
      description: "Layout variant",
    },
    isMobile: {
      control: "boolean",
      description: "Mobile mode",
    },
  },
};

export default meta;
type Story = StoryObj<typeof ListItem>;

export const SessionItem: Story = {
  args: {
    leading: <AgentLogo className="w-3 h-3" />,
    title: "Project Planning Session",
    subtitle: (
      <div className="flex items-center gap-1">
        <Clock className="w-2.5 h-2.5 text-muted-foreground" />
        <TimeAgo
          date={new Date(Date.now() - 5 * 60 * 1000)}
          className="text-xs text-muted-foreground"
        />
      </div>
    ),
    trailing: (
      <Badge variant="secondary" className="text-xs px-1 py-0">
        12
      </Badge>
    ),
    actions: (
      <button className="w-6 h-6 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded flex items-center justify-center">
        <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
      </button>
    ),
  },
};

export const SelectedSessionItem: Story = {
  args: {
    ...SessionItem.args,
    selected: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Session item in selected state",
      },
    },
  },
};

export const ActiveSessionItem: Story = {
  args: {
    ...SessionItem.args,
    active: true,
    showActiveIndicator: true,
    subtitle: (
      <div className="flex items-center gap-1">
        <Clock className="w-2.5 h-2.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Just now</span>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: "Active session with green pulsing indicator",
      },
    },
  },
};

export const UserItem: Story = {
  args: {
    leading: (
      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
        <User className="w-4 h-4" />
      </div>
    ),
    title: "John Doe",
    subtitle: <span className="text-xs text-muted-foreground">john@example.com</span>,
    trailing: (
      <Badge variant="success" className="text-xs">
        Online
      </Badge>
    ),
  },
};

export const FileItem: Story = {
  args: {
    leading: <File className="w-5 h-5 text-muted-foreground" />,
    title: "document.pdf",
    subtitle: <span className="text-xs text-muted-foreground">2.4 MB</span>,
    actions: (
      <>
        <button className="w-6 h-6 hover:bg-accent rounded flex items-center justify-center">
          <Download className="w-3 h-3" />
        </button>
        <button className="w-6 h-6 hover:bg-accent rounded flex items-center justify-center">
          <Trash2 className="w-3 h-3 text-red-600" />
        </button>
      </>
    ),
  },
};

export const FolderItem: Story = {
  args: {
    leading: <Folder className="w-5 h-5 text-blue-500" />,
    title: "Projects",
    subtitle: <span className="text-xs text-muted-foreground">24 items</span>,
    trailing: <Star className="w-4 h-4 text-yellow-500" />,
  },
};

export const EmailItem: Story = {
  args: {
    leading: (
      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
        <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      </div>
    ),
    title: "Meeting Invitation",
    subtitle: (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">From: Sarah Chen</span>
        <span className="text-xs text-muted-foreground">•</span>
        <span className="text-xs text-muted-foreground">2 hours ago</span>
      </div>
    ),
    actions: (
      <>
        <button className="w-6 h-6 hover:bg-accent rounded flex items-center justify-center">
          <Edit className="w-3 h-3" />
        </button>
        <button className="w-6 h-6 hover:bg-accent rounded flex items-center justify-center">
          <Trash2 className="w-3 h-3 text-red-600" />
        </button>
      </>
    ),
  },
};

export const WithoutLeading: Story = {
  args: {
    title: "Simple Item",
    subtitle: <span className="text-xs text-muted-foreground">No leading content</span>,
  },
};

export const WithoutSubtitle: Story = {
  args: {
    leading: <MessageSquare className="w-5 h-5" />,
    title: "Title Only",
  },
};

export const WithoutTrailing: Story = {
  args: {
    leading: <File className="w-5 h-5" />,
    title: "No Trailing Content",
    subtitle: <span className="text-xs text-muted-foreground">Subtitle here</span>,
  },
};

export const WithoutActions: Story = {
  args: {
    leading: <User className="w-5 h-5" />,
    title: "No Actions",
    subtitle: <span className="text-xs text-muted-foreground">Static item</span>,
  },
};

export const CompactVariant: Story = {
  args: {
    leading: <MessageSquare className="w-4 h-4" />,
    title: "Compact Item",
    subtitle: <span className="text-xs text-muted-foreground">Smaller padding</span>,
    variant: "compact",
  },
};

export const MobileLayout: Story = {
  args: {
    leading: <AgentLogo className="w-3 h-3" />,
    title: "Mobile Session",
    subtitle: (
      <div className="flex items-center gap-1">
        <Clock className="w-2.5 h-2.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">5 mins ago</span>
      </div>
    ),
    trailing: (
      <Badge variant="secondary" className="text-xs px-1 py-0">
        8
      </Badge>
    ),
    actions: (
      <button className="w-5 h-5 rounded-md bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
        <Trash2 className="w-2.5 h-2.5 text-red-600 dark:text-red-400" />
      </button>
    ),
    isMobile: true,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
};

export const LongTitle: Story = {
  args: {
    leading: <File className="w-5 h-5" />,
    title:
      "Very Long File Name That Should Be Truncated With Ellipsis To Prevent Layout Issues.pdf",
    subtitle: <span className="text-xs text-muted-foreground">256 KB</span>,
  },
};

export const MultipleActions: Story = {
  args: {
    leading: <File className="w-5 h-5" />,
    title: "Document.docx",
    subtitle: <span className="text-xs text-muted-foreground">Last edited today</span>,
    actions: (
      <>
        <button
          className="w-6 h-6 hover:bg-accent rounded flex items-center justify-center"
          title="Star"
        >
          <Star className="w-3 h-3" />
        </button>
        <button
          className="w-6 h-6 hover:bg-accent rounded flex items-center justify-center"
          title="Download"
        >
          <Download className="w-3 h-3" />
        </button>
        <button
          className="w-6 h-6 hover:bg-accent rounded flex items-center justify-center"
          title="Edit"
        >
          <Edit className="w-3 h-3" />
        </button>
        <button
          className="w-6 h-6 hover:bg-accent rounded flex items-center justify-center"
          title="Delete"
        >
          <Trash2 className="w-3 h-3 text-red-600" />
        </button>
      </>
    ),
  },
};

export const SessionList: Story = {
  render: () => (
    <div className="max-w-md border rounded-lg p-2 space-y-1">
      <ListItem
        leading={<AgentLogo className="w-3 h-3" />}
        title="Active Session"
        subtitle={
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Just now</span>
          </div>
        }
        trailing={
          <Badge variant="secondary" className="text-xs px-1 py-0">
            5
          </Badge>
        }
        actions={
          <button className="w-6 h-6 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 rounded flex items-center justify-center">
            <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
          </button>
        }
        active
        showActiveIndicator
        selected
      />
      <ListItem
        leading={<AgentLogo className="w-3 h-3" />}
        title="Code Review Session"
        subtitle={
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">15 mins ago</span>
          </div>
        }
        trailing={
          <Badge variant="secondary" className="text-xs px-1 py-0">
            8
          </Badge>
        }
        actions={
          <button className="w-6 h-6 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 rounded flex items-center justify-center">
            <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
          </button>
        }
      />
      <ListItem
        leading={<AgentLogo className="w-3 h-3" />}
        title="Planning Meeting"
        subtitle={
          <div className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">2 hours ago</span>
          </div>
        }
        trailing={
          <Badge variant="secondary" className="text-xs px-1 py-0">
            3
          </Badge>
        }
        actions={
          <button className="w-6 h-6 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 rounded flex items-center justify-center">
            <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
          </button>
        }
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example of multiple session items in a list",
      },
    },
  },
};

export const FileExplorer: Story = {
  render: () => (
    <div className="max-w-md border rounded-lg p-2 space-y-1">
      <ListItem
        leading={<Folder className="w-5 h-5 text-blue-500" />}
        title="Documents"
        subtitle={<span className="text-xs text-muted-foreground">48 items</span>}
        trailing={<Star className="w-4 h-4 text-yellow-500" />}
      />
      <ListItem
        leading={<Folder className="w-5 h-5 text-blue-500" />}
        title="Projects"
        subtitle={<span className="text-xs text-muted-foreground">12 items</span>}
      />
      <ListItem
        leading={<File className="w-5 h-5 text-muted-foreground" />}
        title="README.md"
        subtitle={<span className="text-xs text-muted-foreground">8.2 KB</span>}
        actions={
          <>
            <button className="w-6 h-6 hover:bg-accent rounded flex items-center justify-center">
              <Download className="w-3 h-3" />
            </button>
            <button className="w-6 h-6 hover:bg-accent rounded flex items-center justify-center">
              <Trash2 className="w-3 h-3 text-red-600" />
            </button>
          </>
        }
      />
      <ListItem
        leading={<File className="w-5 h-5 text-muted-foreground" />}
        title="package.json"
        subtitle={<span className="text-xs text-muted-foreground">1.5 KB</span>}
        actions={
          <>
            <button className="w-6 h-6 hover:bg-accent rounded flex items-center justify-center">
              <Download className="w-3 h-3" />
            </button>
            <button className="w-6 h-6 hover:bg-accent rounded flex items-center justify-center">
              <Trash2 className="w-3 h-3 text-red-600" />
            </button>
          </>
        }
        selected
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "File explorer example with folders and files",
      },
    },
  },
};

export const UserList: Story = {
  render: () => (
    <div className="max-w-md border rounded-lg p-2 space-y-1">
      <ListItem
        leading={
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
            JD
          </div>
        }
        title="John Doe"
        subtitle={<span className="text-xs text-muted-foreground">john.doe@example.com</span>}
        trailing={
          <Badge variant="success" className="text-xs">
            Online
          </Badge>
        }
      />
      <ListItem
        leading={
          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
            SC
          </div>
        }
        title="Sarah Chen"
        subtitle={<span className="text-xs text-muted-foreground">sarah.chen@example.com</span>}
        trailing={
          <Badge variant="warning" className="text-xs">
            Away
          </Badge>
        }
      />
      <ListItem
        leading={
          <div className="w-8 h-8 bg-slate-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
            MB
          </div>
        }
        title="Mike Brown"
        subtitle={<span className="text-xs text-muted-foreground">mike.brown@example.com</span>}
        trailing={
          <Badge variant="secondary" className="text-xs">
            Offline
          </Badge>
        }
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "User list with avatars and online status",
      },
    },
  },
};

export const InteractiveDemo: Story = {
  render: () => {
    const [selected, setSelected] = React.useState<number | null>(0);

    return (
      <div className="max-w-md border rounded-lg p-2 space-y-1">
        {[
          { title: "First Item", subtitle: "Click to select" },
          { title: "Second Item", subtitle: "Click to select" },
          { title: "Third Item", subtitle: "Click to select" },
        ].map((item, index) => (
          <ListItem
            key={index}
            leading={<MessageSquare className="w-5 h-5" />}
            title={item.title}
            subtitle={<span className="text-xs text-muted-foreground">{item.subtitle}</span>}
            selected={selected === index}
            onClick={() => setSelected(index)}
          />
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demo with selectable items",
      },
    },
  },
};
