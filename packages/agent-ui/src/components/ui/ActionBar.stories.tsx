import type { Meta, StoryObj } from "@storybook/react";
import { ActionBar } from "./ActionBar";
import {
  MessageSquare,
  RefreshCw,
  Plus,
  Download,
  Upload,
  Settings,
  Filter,
  Trash2,
  Edit,
  Save,
} from "lucide-react";

const meta: Meta<typeof ActionBar> = {
  title: "UI/ActionBar",
  component: ActionBar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Compound component for action button layouts. Provides Primary (flex-1) and Icon (square) button variants.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ActionBar>;

export const SessionActions: Story = {
  render: () => (
    <ActionBar>
      <ActionBar.Primary>
        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
        New Session
      </ActionBar.Primary>
      <ActionBar.Icon title="Refresh sessions">
        <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
      </ActionBar.Icon>
    </ActionBar>
  ),
  parameters: {
    docs: {
      description: {
        story: "SessionSearchBar pattern: Primary button + Icon button",
      },
    },
  },
};

export const WithLoadingPrimary: Story = {
  render: () => (
    <ActionBar>
      <ActionBar.Primary loading>
        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
        New Session
      </ActionBar.Primary>
      <ActionBar.Icon>
        <RefreshCw className="w-3.5 h-3.5" />
      </ActionBar.Icon>
    </ActionBar>
  ),
  parameters: {
    docs: {
      description: {
        story: "Primary button with loading state",
      },
    },
  },
};

export const WithLoadingIcon: Story = {
  render: () => (
    <ActionBar>
      <ActionBar.Primary>
        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
        New Session
      </ActionBar.Primary>
      <ActionBar.Icon loading>
        <RefreshCw className="w-3.5 h-3.5" />
      </ActionBar.Icon>
    </ActionBar>
  ),
  parameters: {
    docs: {
      description: {
        story: "Icon button with loading state (spinning)",
      },
    },
  },
};

export const CreateAndSave: Story = {
  render: () => (
    <ActionBar>
      <ActionBar.Primary>
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Create New
      </ActionBar.Primary>
      <ActionBar.Icon title="Save current">
        <Save className="w-3.5 h-3.5" />
      </ActionBar.Icon>
    </ActionBar>
  ),
};

export const UploadDownload: Story = {
  render: () => (
    <ActionBar>
      <ActionBar.Primary variant="outline">
        <Upload className="w-3.5 h-3.5 mr-1.5" />
        Upload File
      </ActionBar.Primary>
      <ActionBar.Icon variant="outline" title="Download">
        <Download className="w-3.5 h-3.5" />
      </ActionBar.Icon>
    </ActionBar>
  ),
  parameters: {
    docs: {
      description: {
        story: "Using outline variant for both buttons",
      },
    },
  },
};

export const MultipleIconButtons: Story = {
  render: () => (
    <ActionBar>
      <ActionBar.Primary>
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        New Item
      </ActionBar.Primary>
      <ActionBar.Icon title="Refresh">
        <RefreshCw className="w-3.5 h-3.5" />
      </ActionBar.Icon>
      <ActionBar.Icon title="Filter">
        <Filter className="w-3.5 h-3.5" />
      </ActionBar.Icon>
      <ActionBar.Icon title="Settings">
        <Settings className="w-3.5 h-3.5" />
      </ActionBar.Icon>
    </ActionBar>
  ),
  parameters: {
    docs: {
      description: {
        story: "Primary button with multiple icon buttons",
      },
    },
  },
};

export const IconButtonsOnly: Story = {
  render: () => (
    <ActionBar>
      <ActionBar.Icon title="Edit">
        <Edit className="w-3.5 h-3.5" />
      </ActionBar.Icon>
      <ActionBar.Icon title="Delete" variant="destructive">
        <Trash2 className="w-3.5 h-3.5" />
      </ActionBar.Icon>
      <ActionBar.Icon title="Settings">
        <Settings className="w-3.5 h-3.5" />
      </ActionBar.Icon>
    </ActionBar>
  ),
  parameters: {
    docs: {
      description: {
        story: "Icon buttons only (no primary button)",
      },
    },
  },
};

export const WithGroups: Story = {
  render: () => (
    <ActionBar className="justify-between">
      <ActionBar.Group>
        <ActionBar.Primary>
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          New
        </ActionBar.Primary>
        <ActionBar.Icon>
          <RefreshCw className="w-3.5 h-3.5" />
        </ActionBar.Icon>
      </ActionBar.Group>
      <ActionBar.Group>
        <ActionBar.Icon>
          <Filter className="w-3.5 h-3.5" />
        </ActionBar.Icon>
        <ActionBar.Icon>
          <Settings className="w-3.5 h-3.5" />
        </ActionBar.Icon>
      </ActionBar.Group>
    </ActionBar>
  ),
  parameters: {
    docs: {
      description: {
        story: "Using ActionBar.Group to separate button groups (with justify-between)",
      },
    },
  },
};

export const DestructiveAction: Story = {
  render: () => (
    <ActionBar>
      <ActionBar.Primary variant="destructive">
        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
        Delete All
      </ActionBar.Primary>
      <ActionBar.Icon variant="outline">
        <RefreshCw className="w-3.5 h-3.5" />
      </ActionBar.Icon>
    </ActionBar>
  ),
};

export const SecondaryActions: Story = {
  render: () => (
    <ActionBar>
      <ActionBar.Primary variant="secondary">
        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
        New Draft
      </ActionBar.Primary>
      <ActionBar.Icon variant="secondary">
        <RefreshCw className="w-3.5 h-3.5" />
      </ActionBar.Icon>
    </ActionBar>
  ),
};

export const GhostActions: Story = {
  render: () => (
    <ActionBar>
      <ActionBar.Primary variant="ghost">
        <Plus className="w-3.5 h-3.5 mr-1.5" />
        Add Item
      </ActionBar.Primary>
      <ActionBar.Icon variant="ghost">
        <Settings className="w-3.5 h-3.5" />
      </ActionBar.Icon>
    </ActionBar>
  ),
};

export const DisabledState: Story = {
  render: () => (
    <ActionBar>
      <ActionBar.Primary disabled>
        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
        New Session
      </ActionBar.Primary>
      <ActionBar.Icon disabled>
        <RefreshCw className="w-3.5 h-3.5" />
      </ActionBar.Icon>
    </ActionBar>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Default</p>
        <ActionBar>
          <ActionBar.Primary>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Primary
          </ActionBar.Primary>
          <ActionBar.Icon>
            <RefreshCw className="w-3.5 h-3.5" />
          </ActionBar.Icon>
        </ActionBar>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Outline</p>
        <ActionBar>
          <ActionBar.Primary variant="outline">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Primary
          </ActionBar.Primary>
          <ActionBar.Icon variant="outline">
            <RefreshCw className="w-3.5 h-3.5" />
          </ActionBar.Icon>
        </ActionBar>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Secondary</p>
        <ActionBar>
          <ActionBar.Primary variant="secondary">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Primary
          </ActionBar.Primary>
          <ActionBar.Icon variant="secondary">
            <RefreshCw className="w-3.5 h-3.5" />
          </ActionBar.Icon>
        </ActionBar>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Ghost</p>
        <ActionBar>
          <ActionBar.Primary variant="ghost">
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Primary
          </ActionBar.Primary>
          <ActionBar.Icon variant="ghost">
            <RefreshCw className="w-3.5 h-3.5" />
          </ActionBar.Icon>
        </ActionBar>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Destructive</p>
        <ActionBar>
          <ActionBar.Primary variant="destructive">
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Delete
          </ActionBar.Primary>
          <ActionBar.Icon variant="destructive">
            <Trash2 className="w-3.5 h-3.5" />
          </ActionBar.Icon>
        </ActionBar>
      </div>
    </div>
  ),
};

export const SessionSearchBarExample: Story = {
  render: () => (
    <div className="border rounded-lg p-4 max-w-md">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Sessions</h3>
        <ActionBar>
          <ActionBar.Primary>
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            New Session
          </ActionBar.Primary>
          <ActionBar.Icon title="Refresh sessions">
            <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-300" />
          </ActionBar.Icon>
        </ActionBar>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example matching SessionSearchBar component design",
      },
    },
  },
};

export const CustomStyling: Story = {
  render: () => (
    <ActionBar className="bg-muted/50 p-2 rounded-lg">
      <ActionBar.Primary className="bg-primary hover:bg-primary/90">
        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
        Custom Style
      </ActionBar.Primary>
      <ActionBar.Icon className="hover:bg-accent">
        <RefreshCw className="w-3.5 h-3.5" />
      </ActionBar.Icon>
    </ActionBar>
  ),
  parameters: {
    docs: {
      description: {
        story: "ActionBar with custom container styling",
      },
    },
  },
};

export const ResponsiveLayout: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="max-w-xs">
        <p className="text-sm font-medium mb-2">Mobile (narrow)</p>
        <ActionBar>
          <ActionBar.Primary>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New
          </ActionBar.Primary>
          <ActionBar.Icon>
            <RefreshCw className="w-3.5 h-3.5" />
          </ActionBar.Icon>
        </ActionBar>
      </div>
      <div className="max-w-md">
        <p className="text-sm font-medium mb-2">Tablet (medium)</p>
        <ActionBar>
          <ActionBar.Primary>
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            New Session
          </ActionBar.Primary>
          <ActionBar.Icon>
            <RefreshCw className="w-3.5 h-3.5" />
          </ActionBar.Icon>
        </ActionBar>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Desktop (wide)</p>
        <ActionBar>
          <ActionBar.Primary>
            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
            New Session
          </ActionBar.Primary>
          <ActionBar.Icon>
            <RefreshCw className="w-3.5 h-3.5" />
          </ActionBar.Icon>
          <ActionBar.Icon>
            <Filter className="w-3.5 h-3.5" />
          </ActionBar.Icon>
          <ActionBar.Icon>
            <Settings className="w-3.5 h-3.5" />
          </ActionBar.Icon>
        </ActionBar>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "ActionBar adapts well to different container widths",
      },
    },
  },
};
