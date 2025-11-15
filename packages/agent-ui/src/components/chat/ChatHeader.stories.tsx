import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { ChatHeader, type ChatTab } from "./ChatHeader";

const meta: Meta<typeof ChatHeader> = {
  title: "Chat/ChatHeader",
  component: ChatHeader,
  tags: ["autodocs"],
  argTypes: {
    activeTab: {
      control: "select",
      options: ["chat", "shell", "files"],
    },
    isMobile: {
      control: "boolean",
    },
    showBorder: {
      control: "boolean",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Specialized header for chat interfaces with session title and tab navigation (Chat/Shell/Files). Combines PageHeader and TabNavigation UI components.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChatHeader>;

export const Default: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState<ChatTab>("chat");
    return <ChatHeader title="New Session" activeTab={activeTab} onTabChange={setActiveTab} />;
  },
};

export const WithSubtitle: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState<ChatTab>("chat");
    return (
      <ChatHeader
        title="Agent Conversation"
        subtitle="deepractice-ai/project"
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    );
  },
};

export const WithMenuButton: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState<ChatTab>("chat");
    return (
      <ChatHeader
        title="New Session"
        subtitle="deepractice-ai/agent"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onMenuClick={() => alert("Menu clicked!")}
      />
    );
  },
};

export const MobileMode: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState<ChatTab>("chat");
    return (
      <div className="max-w-sm">
        <ChatHeader
          title="Chat Session"
          subtitle="my-project"
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onMenuClick={() => alert("Menu clicked!")}
          isMobile
        />
      </div>
    );
  },
};

export const NoBorder: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState<ChatTab>("chat");
    return (
      <ChatHeader
        title="Borderless Header"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        showBorder={false}
      />
    );
  },
};

export const DifferentTabs: Story = {
  render: () => {
    const [chatTab, setChatTab] = useState<ChatTab>("chat");
    const [shellTab, setShellTab] = useState<ChatTab>("shell");
    const [filesTab, setFilesTab] = useState<ChatTab>("files");

    return (
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Chat Tab Active</p>
          <ChatHeader
            title="Chat Mode"
            subtitle="Conversation active"
            activeTab={chatTab}
            onTabChange={setChatTab}
          />
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Shell Tab Active</p>
          <ChatHeader
            title="Shell Mode"
            subtitle="Terminal ready"
            activeTab={shellTab}
            onTabChange={setShellTab}
          />
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-2">Files Tab Active</p>
          <ChatHeader
            title="Files Mode"
            subtitle="Browse project files"
            activeTab={filesTab}
            onTabChange={setFilesTab}
          />
        </div>
      </div>
    );
  },
};

export const Interactive: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState<ChatTab>("chat");
    const [menuOpen, setMenuOpen] = useState(false);

    const getTabContent = () => {
      switch (activeTab) {
        case "chat":
          return "Chat interface would be displayed here";
        case "shell":
          return "Shell terminal would be displayed here";
        case "files":
          return "File browser would be displayed here";
      }
    };

    return (
      <div className="border border-border rounded-lg overflow-hidden">
        <ChatHeader
          title="Interactive Demo"
          subtitle="Click tabs to switch modes"
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onMenuClick={() => setMenuOpen(!menuOpen)}
        />

        <div className="p-6 bg-muted/30">
          <p className="text-sm text-muted-foreground mb-2">
            Current mode: <strong>{activeTab}</strong>
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            Menu open: <strong>{menuOpen ? "Yes" : "No"}</strong>
          </p>
          <div className="mt-4 p-4 bg-card rounded-md border border-border">
            <p className="text-sm">{getTabContent()}</p>
          </div>
        </div>
      </div>
    );
  },
};

export const UseCases: Story = {
  render: () => {
    const [tab1, setTab1] = useState<ChatTab>("chat");
    const [tab2, setTab2] = useState<ChatTab>("chat");

    return (
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium mb-3">Desktop Layout</p>
          <p className="text-xs text-muted-foreground mb-3">
            Full header with session info and tab navigation
          </p>
          <div className="border border-border rounded-lg overflow-hidden">
            <ChatHeader
              title="Claude Agent Session #42"
              subtitle="deepractice-ai/agent • Session ID: abc123"
              activeTab={tab1}
              onTabChange={setTab1}
            />
            <div className="h-48 bg-muted/20 flex items-center justify-center text-sm text-muted-foreground">
              Content area ({tab1} mode)
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Mobile Layout</p>
          <p className="text-xs text-muted-foreground mb-3">Compact header with hamburger menu</p>
          <div className="max-w-sm border border-border rounded-lg overflow-hidden">
            <ChatHeader
              title="Chat Session"
              subtitle="my-project"
              activeTab={tab2}
              onTabChange={setTab2}
              onMenuClick={() => alert("Open sidebar")}
              isMobile
            />
            <div className="h-48 bg-muted/20 flex items-center justify-center text-sm text-muted-foreground">
              Content area ({tab2} mode)
            </div>
          </div>
        </div>
      </div>
    );
  },
};
