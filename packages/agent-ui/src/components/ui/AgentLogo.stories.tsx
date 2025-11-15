import type { Meta, StoryObj } from "@storybook/react";
import { AgentLogo } from "./AgentLogo";

const meta: Meta<typeof AgentLogo> = {
  title: "UI/AgentLogo",
  component: AgentLogo,
  tags: ["autodocs"],
  argTypes: {
    className: {
      control: "text",
      description: "Custom CSS classes for sizing and styling",
    },
    src: {
      control: "text",
      description: "Custom icon source URL",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Simple logo component for displaying the Agent AI icon. Single responsibility: render a logo image with consistent styling.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof AgentLogo>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    className: "w-4 h-4",
  },
};

export const Medium: Story = {
  args: {
    className: "w-6 h-6",
  },
};

export const Large: Story = {
  args: {
    className: "w-8 h-8",
  },
};

export const ExtraLarge: Story = {
  args: {
    className: "w-12 h-12",
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-2">
        <AgentLogo className="w-4 h-4" />
        <p className="text-xs text-slate-600">Small (16px)</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <AgentLogo className="w-5 h-5" />
        <p className="text-xs text-slate-600">Default (20px)</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <AgentLogo className="w-6 h-6" />
        <p className="text-xs text-slate-600">Medium (24px)</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <AgentLogo className="w-8 h-8" />
        <p className="text-xs text-slate-600">Large (32px)</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <AgentLogo className="w-12 h-12" />
        <p className="text-xs text-slate-600">Extra Large (48px)</p>
      </div>
    </div>
  ),
};

export const WithBackgrounds: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="p-4 bg-white border border-slate-200 rounded-lg">
        <AgentLogo className="w-8 h-8" />
        <p className="text-xs text-slate-600 mt-2">Light BG</p>
      </div>
      <div className="p-4 bg-slate-900 rounded-lg">
        <AgentLogo className="w-8 h-8" />
        <p className="text-xs text-white mt-2">Dark BG</p>
      </div>
      <div className="p-4 bg-blue-600 rounded-lg">
        <AgentLogo className="w-8 h-8" />
        <p className="text-xs text-white mt-2">Blue BG</p>
      </div>
      <div className="p-4 bg-amber-500 rounded-lg">
        <AgentLogo className="w-8 h-8" />
        <p className="text-xs text-white mt-2">Amber BG</p>
      </div>
    </div>
  ),
};
