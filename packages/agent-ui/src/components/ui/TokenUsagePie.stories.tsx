import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TokenUsagePie } from "./TokenUsagePie";

const meta: Meta<typeof TokenUsagePie> = {
  title: "UI/TokenUsagePie",
  component: TokenUsagePie,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Circular progress indicator for token usage. Color-coded by percentage: Blue (<50%), Amber (50-75%), Red (>75%). Single responsibility: visualize token consumption.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TokenUsagePie>;

export const Low: Story = {
  args: {
    used: 3000,
    total: 8000,
  },
};

export const Medium: Story = {
  args: {
    used: 5000,
    total: 8000,
  },
};

export const High: Story = {
  args: {
    used: 6500,
    total: 8000,
  },
};

export const Critical: Story = {
  args: {
    used: 7800,
    total: 8000,
  },
};

export const Full: Story = {
  args: {
    used: 8000,
    total: 8000,
  },
};

export const LargeNumbers: Story = {
  args: {
    used: 125000,
    total: 200000,
  },
};

export const Invalid: Story = {
  args: {
    used: 0,
    total: 0,
  },
  parameters: {
    docs: {
      description: {
        story: "Returns null for invalid data - nothing rendered",
      },
    },
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium mb-3 text-slate-600">Low Usage (Blue - Normal)</p>
        <div className="flex flex-wrap gap-4">
          <TokenUsagePie used={1000} total={8000} />
          <TokenUsagePie used={2000} total={8000} />
          <TokenUsagePie used={3500} total={8000} />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3 text-slate-600">Medium Usage (Amber - Warning)</p>
        <div className="flex flex-wrap gap-4">
          <TokenUsagePie used={4000} total={8000} />
          <TokenUsagePie used={5000} total={8000} />
          <TokenUsagePie used={5900} total={8000} />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3 text-slate-600">High Usage (Red - Critical)</p>
        <div className="flex flex-wrap gap-4">
          <TokenUsagePie used={6000} total={8000} />
          <TokenUsagePie used={7000} total={8000} />
          <TokenUsagePie used={7900} total={8000} />
        </div>
      </div>
    </div>
  ),
};

export const ProgressSimulation: Story = {
  render: () => {
    const [used, setUsed] = React.useState(1000);
    const total = 8000;

    React.useEffect(() => {
      const interval = setInterval(() => {
        setUsed((prev) => {
          if (prev >= total) return 1000;
          return prev + 200;
        });
      }, 500);

      return () => clearInterval(interval);
    }, []);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <TokenUsagePie used={used} total={total} />
          <div className="text-sm">
            <div className="font-medium">
              {used.toLocaleString()} / {total.toLocaleString()} tokens
            </div>
            <div className="text-slate-500">Animated demo</div>
          </div>
        </div>
      </div>
    );
  },
};

export const InMessageHeader: Story = {
  render: () => (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
            A
          </div>
          <div>
            <div className="font-medium text-sm">Assistant</div>
            <div className="text-xs text-slate-500">2 minutes ago</div>
          </div>
        </div>
        <TokenUsagePie used={5432} total={8192} />
      </div>
    </div>
  ),
};

export const ComparisonView: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border">
        <span className="text-sm font-medium">Message 1</span>
        <TokenUsagePie used={1500} total={8000} />
      </div>
      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border">
        <span className="text-sm font-medium">Message 2</span>
        <TokenUsagePie used={4200} total={8000} />
      </div>
      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border">
        <span className="text-sm font-medium">Message 3</span>
        <TokenUsagePie used={6800} total={8000} />
      </div>
      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border">
        <span className="text-sm font-medium">Message 4</span>
        <TokenUsagePie used={7950} total={8000} />
      </div>
    </div>
  ),
};
