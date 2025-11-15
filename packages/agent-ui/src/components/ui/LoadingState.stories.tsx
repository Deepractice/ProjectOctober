import type { Meta, StoryObj } from "@storybook/react";
import { LoadingState } from "./LoadingState";
import { RefreshCw, Download, Upload, Database } from "lucide-react";

const meta: Meta<typeof LoadingState> = {
  title: "UI/LoadingState",
  component: LoadingState,
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
    showSpinner: {
      control: "boolean",
      description: "Show default spinner if no icon provided",
    },
    icon: {
      control: false,
      description: "Icon or spinner element to display",
    },
  },
};

export default meta;
type Story = StoryObj<typeof LoadingState>;

export const Default: Story = {
  args: {
    title: "Loading...",
  },
};

export const WithDescription: Story = {
  args: {
    title: "Loading sessions...",
    description: "Fetching your Agent sessions",
  },
};

export const RefreshingData: Story = {
  args: {
    icon: <RefreshCw className="w-6 h-6 animate-spin" />,
    title: "Refreshing data...",
    description: "Please wait while we update the information",
  },
};

export const Downloading: Story = {
  args: {
    icon: <Download className="w-6 h-6 animate-bounce" />,
    title: "Downloading files...",
    description: "This may take a few moments",
  },
};

export const Uploading: Story = {
  args: {
    icon: <Upload className="w-6 h-6 animate-bounce" />,
    title: "Uploading data...",
    description: "Please don't close this window",
  },
};

export const ConnectingToDatabase: Story = {
  args: {
    icon: <Database className="w-6 h-6 animate-pulse" />,
    title: "Connecting to database...",
  },
};

export const SpinnerOnly: Story = {
  args: {
    showSpinner: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Minimal loading state with spinner only",
      },
    },
  },
};

export const TitleOnly: Story = {
  args: {
    title: "Loading...",
    showSpinner: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Text-only loading state without spinner",
      },
    },
  },
};

export const SmallSpacing: Story = {
  args: {
    title: "Loading...",
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
    title: "Initializing application...",
    description: "Setting up your workspace",
    spacing: "lg",
  },
  parameters: {
    docs: {
      description: {
        story: "Generous spacing for full-page loading states",
      },
    },
  },
};

export const AllSpacingSizes: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="border rounded-lg">
        <h3 className="text-sm font-semibold p-4 border-b">Small Spacing</h3>
        <LoadingState title="Loading..." spacing="sm" />
      </div>
      <div className="border rounded-lg">
        <h3 className="text-sm font-semibold p-4 border-b">Medium Spacing (Default)</h3>
        <LoadingState title="Loading data..." spacing="md" />
      </div>
      <div className="border rounded-lg">
        <h3 className="text-sm font-semibold p-4 border-b">Large Spacing</h3>
        <LoadingState title="Initializing..." description="Please wait" spacing="lg" />
      </div>
    </div>
  ),
};

export const MultipleScenarios: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-4">Sessions List Loading</h3>
        <LoadingState title="Loading sessions..." description="Fetching your Agent sessions" />
      </div>
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-4">Inline Loading</h3>
        <LoadingState title="Loading..." spacing="sm" />
      </div>
      <div className="border rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-4">Custom Animation</h3>
        <LoadingState icon={<RefreshCw className="w-6 h-6 animate-spin" />} title="Refreshing..." />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different loading state scenarios in various contexts",
      },
    },
  },
};
