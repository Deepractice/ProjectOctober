import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { TabNavigation } from "./TabNavigation";
import { MessageSquare, Terminal, Folder, Home, Settings, User } from "lucide-react";

const meta: Meta<typeof TabNavigation> = {
  title: "UI/TabNavigation",
  component: TabNavigation,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["pills", "underline"],
    },
    iconOnlyMobile: {
      control: "boolean",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Flexible tab navigation component with support for pills and underline styles. Can display tabs with icons, labels, or both.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof TabNavigation>;

// Sample tabs data
const chatTabs = [
  { id: "chat", label: "Chat", icon: <MessageSquare className="w-4 h-4" /> },
  { id: "shell", label: "Shell", icon: <Terminal className="w-4 h-4" /> },
  { id: "files", label: "Files", icon: <Folder className="w-4 h-4" /> },
];

const settingsTabs = [
  { id: "general", label: "General", icon: <Home className="w-4 h-4" /> },
  { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
];

const textOnlyTabs = [
  { id: "overview", label: "Overview" },
  { id: "analytics", label: "Analytics" },
  { id: "reports", label: "Reports" },
  { id: "exports", label: "Exports" },
];

export const PillsVariant: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState("chat");
    return (
      <TabNavigation
        variant="pills"
        tabs={chatTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    );
  },
};

export const UnderlineVariant: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState("chat");
    return (
      <TabNavigation
        variant="underline"
        tabs={chatTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    );
  },
};

export const IconOnlyMobile: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState("chat");
    return (
      <div>
        <p className="text-sm text-muted-foreground mb-4">
          Resize window to see icon-only mode on mobile
        </p>
        <TabNavigation
          variant="pills"
          tabs={chatTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          iconOnlyMobile
        />
      </div>
    );
  },
};

export const TextOnly: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState("overview");
    return (
      <TabNavigation
        variant="pills"
        tabs={textOnlyTabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    );
  },
};

export const WithDisabledTabs: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState("chat");
    const tabsWithDisabled = [
      { id: "chat", label: "Chat", icon: <MessageSquare className="w-4 h-4" /> },
      {
        id: "shell",
        label: "Shell",
        icon: <Terminal className="w-4 h-4" />,
        disabled: true,
      },
      { id: "files", label: "Files", icon: <Folder className="w-4 h-4" /> },
    ];

    return (
      <TabNavigation
        variant="pills"
        tabs={tabsWithDisabled}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    );
  },
};

export const AllVariants: Story = {
  render: () => {
    const [pillsTab, setPillsTab] = useState("chat");
    const [underlineTab, setUnderlineTab] = useState("general");
    const [textTab, setTextTab] = useState("overview");

    return (
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium mb-3 text-foreground">Pills Variant</p>
          <TabNavigation
            variant="pills"
            tabs={chatTabs}
            activeTab={pillsTab}
            onTabChange={setPillsTab}
          />
        </div>

        <div>
          <p className="text-sm font-medium mb-3 text-foreground">Underline Variant</p>
          <TabNavigation
            variant="underline"
            tabs={settingsTabs}
            activeTab={underlineTab}
            onTabChange={setUnderlineTab}
          />
        </div>

        <div>
          <p className="text-sm font-medium mb-3 text-foreground">Text Only</p>
          <TabNavigation
            variant="pills"
            tabs={textOnlyTabs}
            activeTab={textTab}
            onTabChange={setTextTab}
          />
        </div>
      </div>
    );
  },
};

export const UseCases: Story = {
  render: () => {
    const [appTab, setAppTab] = useState("chat");
    const [navTab, setNavTab] = useState("general");

    return (
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium mb-3">Application Mode Switcher</p>
          <p className="text-xs text-muted-foreground mb-3">
            Switch between different application modes (Chat, Shell, Files)
          </p>
          <TabNavigation
            variant="pills"
            tabs={chatTabs}
            activeTab={appTab}
            onTabChange={setAppTab}
          />
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Settings Navigation</p>
          <p className="text-xs text-muted-foreground mb-3">
            Navigate between different settings sections
          </p>
          <TabNavigation
            variant="underline"
            tabs={settingsTabs}
            activeTab={navTab}
            onTabChange={setNavTab}
          />
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Header with Mobile Support</p>
          <p className="text-xs text-muted-foreground mb-3">
            Full layout example with responsive behavior
          </p>
          <div className="border border-border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Session</h2>
              <TabNavigation
                variant="pills"
                tabs={chatTabs}
                activeTab={appTab}
                onTabChange={setAppTab}
                iconOnlyMobile
              />
            </div>
          </div>
        </div>
      </div>
    );
  },
};
