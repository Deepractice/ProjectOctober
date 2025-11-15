import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SessionSearchBar } from "./SessionSearchBar";

const meta: Meta<typeof SessionSearchBar> = {
  title: "Session/SessionSearchBar",
  component: SessionSearchBar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Search input with action buttons for sessions. Combines SearchInput and ActionBar. Desktop shows buttons, mobile hides them.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SessionSearchBar>;

export const Default: Story = {
  args: {
    value: "",
    onChange: (value) => console.log("Search:", value),
    onCreate: () => console.log("Create new session"),
    onRefresh: () => console.log("Refresh sessions"),
  },
};

export const WithValue: Story = {
  args: {
    value: "planning",
    onChange: (value) => console.log("Search:", value),
    onCreate: () => console.log("Create new session"),
    onRefresh: () => console.log("Refresh sessions"),
  },
};

export const Refreshing: Story = {
  args: {
    value: "",
    onChange: () => {},
    onCreate: () => {},
    onRefresh: () => {},
    isRefreshing: true,
  },
  parameters: {
    docs: {
      description: {
        story: "Refresh button shows loading spinner",
      },
    },
  },
};

export const Loading: Story = {
  args: {
    value: "",
    onChange: () => {},
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: "SearchBar is hidden when list is loading",
      },
    },
  },
};

export const MobileMode: Story = {
  args: {
    value: "",
    onChange: () => {},
    onCreate: () => {},
    onRefresh: () => {},
    isMobile: true,
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
    docs: {
      description: {
        story: "Mobile mode - action buttons are hidden",
      },
    },
  },
};

export const WithoutCreate: Story = {
  args: {
    value: "",
    onChange: () => {},
    onRefresh: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Without onCreate handler - button still shows but does nothing",
      },
    },
  },
};

export const WithoutRefresh: Story = {
  args: {
    value: "",
    onChange: () => {},
    onCreate: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: "Without onRefresh handler - button still shows but does nothing",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = React.useState("");
    const [isRefreshing, setIsRefreshing] = React.useState(false);

    const handleCreate = () => {
      alert("Creating new session...");
      setValue("");
    };

    const handleRefresh = async () => {
      setIsRefreshing(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsRefreshing(false);
      alert("Sessions refreshed!");
    };

    return (
      <div className="border rounded-lg overflow-hidden">
        <SessionSearchBar
          value={value}
          onChange={setValue}
          onCreate={handleCreate}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
        <div className="p-4 bg-muted">
          <p className="text-sm">Current search: {value || "(empty)"}</p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Fully interactive with search, create, and refresh",
      },
    },
  },
};

export const DesktopVsMobile: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium mb-2">Desktop (with buttons)</p>
        <div className="border rounded-lg overflow-hidden">
          <SessionSearchBar
            value="planning"
            onChange={() => {}}
            onCreate={() => {}}
            onRefresh={() => {}}
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Mobile (no buttons)</p>
        <div className="border rounded-lg overflow-hidden">
          <SessionSearchBar
            value="planning"
            onChange={() => {}}
            onCreate={() => {}}
            onRefresh={() => {}}
            isMobile
          />
        </div>
      </div>
    </div>
  ),
};
