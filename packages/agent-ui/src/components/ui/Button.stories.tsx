import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "destructive", "outline", "secondary", "ghost", "link"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
    },
    disabled: {
      control: "boolean",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Button component embodying the dual-nature design system. Default (blue) represents computational actions, Secondary (amber) represents generative/creative actions.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: "Button",
    variant: "default",
  },
};

export const Destructive: Story = {
  args: {
    children: "Delete",
    variant: "destructive",
  },
};

export const Outline: Story = {
  args: {
    children: "Outline",
    variant: "outline",
  },
};

export const Secondary: Story = {
  args: {
    children: "Secondary",
    variant: "secondary",
  },
};

export const Ghost: Story = {
  args: {
    children: "Ghost",
    variant: "ghost",
  },
};

export const Link: Story = {
  args: {
    children: "Link",
    variant: "link",
  },
};

export const Small: Story = {
  args: {
    children: "Small",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    children: "Large",
    size: "lg",
  },
};

export const Icon: Story = {
  args: {
    children: "→",
    size: "icon",
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled",
    disabled: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium mb-3 text-slate-600">
          Dual Nature - Computation (Blue) & Generation (Amber)
        </p>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Computational</Button>
          <Button variant="secondary">Generative</Button>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-3 text-slate-600">Neutral & Utility Variants</p>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-3 text-slate-600">Critical Actions</p>
        <div className="flex flex-wrap gap-4">
          <Button variant="destructive">Destructive</Button>
        </div>
      </div>
    </div>
  ),
};

export const UseCases: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium mb-3">
          Computational Actions (Blue - Logic, System, Data)
        </p>
        <div className="flex flex-wrap gap-3">
          <Button>Save</Button>
          <Button>Export</Button>
          <Button>Execute</Button>
          <Button>Analyze</Button>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-3">
          Generative Actions (Amber - Create, Compose, Generate)
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary">Generate</Button>
          <Button variant="secondary">Create</Button>
          <Button variant="secondary">Compose</Button>
          <Button variant="secondary">Suggest</Button>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-3">Mixed Usage Example</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline">Cancel</Button>
          <Button>Save Draft</Button>
          <Button variant="secondary">AI Enhance</Button>
        </div>
      </div>
    </div>
  ),
};
