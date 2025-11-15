import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./Badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "primary",
        "secondary",
        "success",
        "warning",
        "info",
        "destructive",
        "outline",
      ],
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Badge component following the dual-nature design system. Use primary (blue) for computational features, secondary (amber) for generative features.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: "Badge",
    variant: "default",
  },
};

export const Primary: Story = {
  args: {
    children: "Computational",
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    children: "Generative",
    variant: "secondary",
  },
};

export const Success: Story = {
  args: {
    children: "Success",
    variant: "success",
  },
};

export const Warning: Story = {
  args: {
    children: "Warning",
    variant: "warning",
  },
};

export const Info: Story = {
  args: {
    children: "Info",
    variant: "info",
  },
};

export const Destructive: Story = {
  args: {
    children: "Error",
    variant: "destructive",
  },
};

export const Outline: Story = {
  args: {
    children: "Outline",
    variant: "outline",
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2 text-slate-600">Neutral & Semantic</p>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2 text-slate-600">
          Dual Nature - Computation & Generation
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">Computational</Badge>
          <Badge variant="secondary">Generative</Badge>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2 text-slate-600">Status Indicators</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="destructive">Error</Badge>
        </div>
      </div>
    </div>
  ),
};

export const UseCases: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Code Features (Blue)</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="primary">TypeScript</Badge>
          <Badge variant="primary">API v2.0</Badge>
          <Badge variant="primary">System</Badge>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">AI Features (Amber)</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">AI Generated</Badge>
          <Badge variant="secondary">Creative</Badge>
          <Badge variant="secondary">Suggested</Badge>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Status Messages</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">Connected</Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="destructive">Failed</Badge>
          <Badge variant="info">Processing</Badge>
        </div>
      </div>
    </div>
  ),
};
