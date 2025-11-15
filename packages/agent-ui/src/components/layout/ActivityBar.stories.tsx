import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ActivityBar } from "./ActivityBar";
import {
  MessageSquare,
  Search,
  GitBranch,
  Settings,
  Package,
  Database,
  User,
  Bell,
} from "lucide-react";

const meta: Meta<typeof ActivityBar> = {
  title: "Layout/ActivityBar",
  component: ActivityBar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "VSCode-style activity bar with icon buttons. Used for switching between different views/panels.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ActivityBar>;

const defaultItems = [
  { id: "chat", icon: <MessageSquare className="w-5 h-5" />, label: "Chat" },
  { id: "search", icon: <Search className="w-5 h-5" />, label: "Search" },
  { id: "git", icon: <GitBranch className="w-5 h-5" />, label: "Source Control" },
  { id: "settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
];

export const Default: Story = {
  render: () => {
    const [activeId, setActiveId] = useState("chat");
    return (
      <div className="h-96 border border-border rounded-md overflow-hidden">
        <ActivityBar items={defaultItems} activeId={activeId} onItemClick={setActiveId} />
      </div>
    );
  },
};

export const WithBadges: Story = {
  render: () => {
    const [activeId, setActiveId] = useState("chat");
    const itemsWithBadges = [
      { id: "chat", icon: <MessageSquare className="w-5 h-5" />, label: "Chat", badge: 5 },
      { id: "search", icon: <Search className="w-5 h-5" />, label: "Search" },
      { id: "git", icon: <GitBranch className="w-5 h-5" />, label: "Source Control", badge: 12 },
      { id: "packages", icon: <Package className="w-5 h-5" />, label: "Packages", badge: "!" },
    ];

    return (
      <div className="h-96 border border-border rounded-md overflow-hidden">
        <ActivityBar items={itemsWithBadges} activeId={activeId} onItemClick={setActiveId} />
      </div>
    );
  },
};

export const RightPosition: Story = {
  render: () => {
    const [activeId, setActiveId] = useState("chat");
    return (
      <div className="h-96 border border-border rounded-md overflow-hidden flex justify-end">
        <ActivityBar
          items={defaultItems}
          activeId={activeId}
          onItemClick={setActiveId}
          position="right"
        />
      </div>
    );
  },
};

export const Interactive: Story = {
  render: () => {
    const [activeId, setActiveId] = useState("chat");
    const [notificationCount, setNotificationCount] = useState(3);

    const items = [
      { id: "chat", icon: <MessageSquare className="w-5 h-5" />, label: "Chat" },
      {
        id: "search",
        icon: <Search className="w-5 h-5" />,
        label: "Search",
        badge: notificationCount > 0 ? notificationCount : undefined,
      },
      { id: "git", icon: <GitBranch className="w-5 h-5" />, label: "Source Control" },
      { id: "database", icon: <Database className="w-5 h-5" />, label: "Database" },
      { id: "settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
    ];

    return (
      <div className="flex gap-4">
        <div className="h-96 border border-border rounded-md overflow-hidden">
          <ActivityBar
            items={items}
            activeId={activeId}
            onItemClick={(id) => {
              setActiveId(id);
              if (id === "search") {
                setNotificationCount(0);
              }
            }}
          />
        </div>

        <div className="flex-1 p-4 bg-muted/20 rounded-md">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Active View:</p>
              <p className="text-lg font-bold capitalize">{activeId}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Notifications:</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setNotificationCount((c) => c + 1)}
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => setNotificationCount(0)}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const WithBottomItems: Story = {
  render: () => {
    const [activeId, setActiveId] = useState("chat");

    const topItems = [
      { id: "chat", icon: <MessageSquare className="w-5 h-5" />, label: "Chat" },
      { id: "search", icon: <Search className="w-5 h-5" />, label: "Search" },
      { id: "git", icon: <GitBranch className="w-5 h-5" />, label: "Source Control" },
    ];

    const bottomItems = [
      { id: "notifications", icon: <Bell className="w-5 h-5" />, label: "Notifications", badge: 3 },
      { id: "account", icon: <User className="w-5 h-5" />, label: "Account" },
      { id: "settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
    ];

    return (
      <div className="h-96 border border-border rounded-md overflow-hidden">
        <ActivityBar
          items={topItems}
          bottomItems={bottomItems}
          activeId={activeId}
          onItemClick={setActiveId}
        />
      </div>
    );
  },
};

export const FullHeightExample: Story = {
  render: () => {
    const [activeId, setActiveId] = useState("chat");

    const topItems = [
      { id: "chat", icon: <MessageSquare className="w-5 h-5" />, label: "Chat" },
      { id: "search", icon: <Search className="w-5 h-5" />, label: "Search" },
      { id: "git", icon: <GitBranch className="w-5 h-5" />, label: "Source Control", badge: 5 },
    ];

    const bottomItems = [
      { id: "account", icon: <User className="w-5 h-5" />, label: "Account" },
      { id: "settings", icon: <Settings className="w-5 h-5" />, label: "Settings" },
    ];

    return (
      <div className="h-screen flex">
        <ActivityBar
          items={topItems}
          bottomItems={bottomItems}
          activeId={activeId}
          onItemClick={setActiveId}
        />
        <div className="flex-1 flex items-center justify-center bg-muted/20">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2 capitalize">{activeId} View</h3>
            <p className="text-sm text-muted-foreground">
              Click activity bar icons to switch views
            </p>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    layout: "fullscreen",
  },
};
