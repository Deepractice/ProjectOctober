import type { Meta, StoryObj } from "@storybook/react";
import { TimeAgo } from "./TimeAgo";
import { Clock } from "lucide-react";

const meta: Meta<typeof TimeAgo> = {
  title: "UI/TimeAgo",
  component: TimeAgo,
  tags: ["autodocs"],
  argTypes: {
    date: {
      control: "date",
      description: "Date to display (ISO string or Date object)",
    },
    updateInterval: {
      control: "number",
      description: "Auto-update interval in milliseconds (0 to disable)",
    },
    showTooltip: {
      control: "boolean",
      description: "Show tooltip with full date on hover",
    },
  },
};

export default meta;
type Story = StoryObj<typeof TimeAgo>;

// Helper to create dates relative to now
const now = new Date();
const secondsAgo = (seconds: number) => new Date(now.getTime() - seconds * 1000).toISOString();
const minutesAgo = (minutes: number) => new Date(now.getTime() - minutes * 60 * 1000).toISOString();
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
const daysAgo = (days: number) =>
  new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();

export const JustNow: Story = {
  args: {
    date: secondsAgo(30),
  },
  parameters: {
    docs: {
      description: {
        story: "Shows 'Just now' for timestamps within the last minute",
      },
    },
  },
};

export const MinutesAgo: Story = {
  args: {
    date: minutesAgo(5),
  },
  parameters: {
    docs: {
      description: {
        story: "Shows '5 mins ago' for recent timestamps",
      },
    },
  },
};

export const OneMinuteAgo: Story = {
  args: {
    date: minutesAgo(1),
  },
};

export const HoursAgo: Story = {
  args: {
    date: hoursAgo(3),
  },
  parameters: {
    docs: {
      description: {
        story: "Shows '3 hours ago' for timestamps within the day",
      },
    },
  },
};

export const OneHourAgo: Story = {
  args: {
    date: hoursAgo(1),
  },
};

export const DaysAgo: Story = {
  args: {
    date: daysAgo(3),
  },
  parameters: {
    docs: {
      description: {
        story: "Shows '3 days ago' for recent dates",
      },
    },
  },
};

export const OneDayAgo: Story = {
  args: {
    date: daysAgo(1),
  },
};

export const WeekAgo: Story = {
  args: {
    date: daysAgo(8),
  },
  parameters: {
    docs: {
      description: {
        story: "Shows formatted date for timestamps over a week ago",
      },
    },
  },
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex items-center gap-1">
      <Clock className="w-4 h-4 text-muted-foreground" />
      <TimeAgo date={minutesAgo(5)} className="text-sm text-muted-foreground" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Common pattern with Clock icon (like in SessionItem)",
      },
    },
  },
};

export const WithCustomStyling: Story = {
  args: {
    date: hoursAgo(2),
    className: "text-xs font-medium text-blue-600 dark:text-blue-400",
  },
  parameters: {
    docs: {
      description: {
        story: "Custom styling with Tailwind classes",
      },
    },
  },
};

export const NoAutoUpdate: Story = {
  args: {
    date: minutesAgo(5),
    updateInterval: 0,
  },
  parameters: {
    docs: {
      description: {
        story: "Disable auto-update by setting updateInterval to 0",
      },
    },
  },
};

export const FastUpdate: Story = {
  args: {
    date: secondsAgo(30),
    updateInterval: 5000,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Fast update interval (5 seconds) for real-time displays. Watch it change from 'Just now' to '1 min ago'.",
      },
    },
  },
};

export const NoTooltip: Story = {
  args: {
    date: hoursAgo(2),
    showTooltip: false,
  },
  parameters: {
    docs: {
      description: {
        story: "Disable tooltip by setting showTooltip to false (hover to see no tooltip)",
      },
    },
  },
};

export const InvalidDate: Story = {
  args: {
    date: "invalid-date",
  },
  parameters: {
    docs: {
      description: {
        story: "Shows 'Unknown' for invalid dates",
      },
    },
  },
};

export const AllTimeRanges: Story = {
  render: () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 border rounded">
        <span className="text-sm font-medium">Just now</span>
        <TimeAgo date={secondsAgo(30)} className="text-xs text-muted-foreground" />
      </div>
      <div className="flex items-center justify-between p-3 border rounded">
        <span className="text-sm font-medium">1 minute</span>
        <TimeAgo date={minutesAgo(1)} className="text-xs text-muted-foreground" />
      </div>
      <div className="flex items-center justify-between p-3 border rounded">
        <span className="text-sm font-medium">5 minutes</span>
        <TimeAgo date={minutesAgo(5)} className="text-xs text-muted-foreground" />
      </div>
      <div className="flex items-center justify-between p-3 border rounded">
        <span className="text-sm font-medium">1 hour</span>
        <TimeAgo date={hoursAgo(1)} className="text-xs text-muted-foreground" />
      </div>
      <div className="flex items-center justify-between p-3 border rounded">
        <span className="text-sm font-medium">3 hours</span>
        <TimeAgo date={hoursAgo(3)} className="text-xs text-muted-foreground" />
      </div>
      <div className="flex items-center justify-between p-3 border rounded">
        <span className="text-sm font-medium">1 day</span>
        <TimeAgo date={daysAgo(1)} className="text-xs text-muted-foreground" />
      </div>
      <div className="flex items-center justify-between p-3 border rounded">
        <span className="text-sm font-medium">3 days</span>
        <TimeAgo date={daysAgo(3)} className="text-xs text-muted-foreground" />
      </div>
      <div className="flex items-center justify-between p-3 border rounded">
        <span className="text-sm font-medium">2 weeks</span>
        <TimeAgo date={daysAgo(14)} className="text-xs text-muted-foreground" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All time range formats in one view",
      },
    },
  },
};

export const SessionItemExample: Story = {
  render: () => (
    <div className="border rounded-lg p-4 max-w-md">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-medium">A</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">Project Planning Session</div>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <TimeAgo date={minutesAgo(15)} className="text-xs text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example of TimeAgo used in a SessionItem-like component",
      },
    },
  },
};

export const MessageTimestamp: Story = {
  render: () => (
    <div className="max-w-md space-y-2">
      <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg rounded-tl-none">
        <p className="text-sm">Hey, how's the project going?</p>
        <TimeAgo
          date={minutesAgo(5)}
          className="text-xs text-blue-700 dark:text-blue-300 mt-1 block"
        />
      </div>
      <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg rounded-tr-none ml-8">
        <p className="text-sm">Going well! Just finished the UI components.</p>
        <TimeAgo
          date={minutesAgo(2)}
          className="text-xs text-slate-600 dark:text-slate-400 mt-1 block"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Example of TimeAgo used in chat message bubbles",
      },
    },
  },
};
