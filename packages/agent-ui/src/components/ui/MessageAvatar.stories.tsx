import type { Meta, StoryObj } from "@storybook/react";
import { MessageAvatar } from "./MessageAvatar";
import { Bot, User, AlertCircle, Wrench, Sparkles, Brain, Shield } from "lucide-react";

const meta: Meta<typeof MessageAvatar> = {
  title: "UI/MessageAvatar",
  component: MessageAvatar,
  tags: ["autodocs"],
  argTypes: {
    label: {
      control: "text",
      description: "Label text next to avatar",
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "success", "warning", "error", "info", "neutral"],
      description: "Color variant",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "Avatar size",
    },
    icon: {
      control: false,
      description: "Lucide icon component",
    },
    src: {
      control: "text",
      description: "Image URL",
    },
  },
};

export default meta;
type Story = StoryObj<typeof MessageAvatar>;

export const AIAssistant: Story = {
  args: {
    label: "AI Assistant",
    variant: "primary",
    icon: <Bot className="w-5 h-5 text-white" />,
  },
};

export const UserAvatar: Story = {
  args: {
    label: "You",
    variant: "secondary",
    icon: <User className="w-5 h-5 text-white" />,
  },
};

export const System: Story = {
  args: {
    label: "System",
    variant: "info",
    icon: <Wrench className="w-5 h-5 text-white" />,
  },
};

export const Error: Story = {
  args: {
    label: "Error",
    variant: "error",
    icon: <AlertCircle className="w-5 h-5 text-white" />,
  },
};

export const Success: Story = {
  args: {
    label: "Task Completed",
    variant: "success",
    icon: <Sparkles className="w-5 h-5 text-white" />,
  },
};

export const Warning: Story = {
  args: {
    label: "Warning",
    variant: "warning",
    icon: <AlertCircle className="w-5 h-5 text-white" />,
  },
};

export const Neutral: Story = {
  args: {
    label: "Unknown",
    variant: "neutral",
  },
};

export const WithoutIcon: Story = {
  args: {
    label: "Agent Smith",
    variant: "primary",
  },
  parameters: {
    docs: {
      description: {
        story: "Without an icon, shows the first letter of the label",
      },
    },
  },
};

export const WithImage: Story = {
  args: {
    label: "Custom Agent",
    variant: "info",
    src: "https://api.dicebear.com/7.x/bottts/svg?seed=agent",
    alt: "Custom Agent Avatar",
  },
};

export const SmallSize: Story = {
  args: {
    label: "Small Avatar",
    variant: "primary",
    size: "sm",
    icon: <Bot className="w-4 h-4 text-white" />,
  },
};

export const LargeSize: Story = {
  args: {
    label: "Large Avatar",
    variant: "secondary",
    size: "lg",
    icon: <User className="w-6 h-6 text-white" />,
  },
};

export const MultipleAgents: Story = {
  render: () => (
    <div className="space-y-4">
      <MessageAvatar
        label="Strategic Planner"
        variant="primary"
        icon={<Brain className="w-5 h-5 text-white" />}
      />
      <MessageAvatar
        label="Code Generator"
        variant="info"
        icon={<Bot className="w-5 h-5 text-white" />}
      />
      <MessageAvatar
        label="Security Auditor"
        variant="error"
        icon={<Shield className="w-5 h-5 text-white" />}
      />
      <MessageAvatar
        label="Quality Checker"
        variant="success"
        icon={<Sparkles className="w-5 h-5 text-white" />}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example of multiple specialized agents in a multi-agent system",
      },
    },
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <MessageAvatar
        label="Primary (AI Assistant)"
        variant="primary"
        icon={<Bot className="w-5 h-5 text-white" />}
      />
      <MessageAvatar
        label="Secondary (User)"
        variant="secondary"
        icon={<User className="w-5 h-5 text-white" />}
      />
      <MessageAvatar
        label="Success"
        variant="success"
        icon={<Sparkles className="w-5 h-5 text-white" />}
      />
      <MessageAvatar
        label="Warning"
        variant="warning"
        icon={<AlertCircle className="w-5 h-5 text-white" />}
      />
      <MessageAvatar
        label="Error"
        variant="error"
        icon={<AlertCircle className="w-5 h-5 text-white" />}
      />
      <MessageAvatar
        label="Info (System)"
        variant="info"
        icon={<Wrench className="w-5 h-5 text-white" />}
      />
      <MessageAvatar label="Neutral" variant="neutral" />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <MessageAvatar
        label="Small"
        variant="primary"
        size="sm"
        icon={<Bot className="w-4 h-4 text-white" />}
      />
      <MessageAvatar
        label="Medium (Default)"
        variant="primary"
        size="md"
        icon={<Bot className="w-5 h-5 text-white" />}
      />
      <MessageAvatar
        label="Large"
        variant="primary"
        size="lg"
        icon={<Bot className="w-6 h-6 text-white" />}
      />
    </div>
  ),
};
