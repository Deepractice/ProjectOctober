import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { PageHeader } from "./PageHeader";
import { TabNavigation } from "./TabNavigation";
import { Button } from "./Button";
import { Menu, ArrowLeft, Settings, MessageSquare, Terminal, Folder } from "lucide-react";

const meta: Meta<typeof PageHeader> = {
  title: "UI/PageHeader",
  component: PageHeader,
  tags: ["autodocs"],
  argTypes: {
    showBorder: {
      control: "boolean",
    },
    isMobile: {
      control: "boolean",
    },
  },
  parameters: {
    docs: {
      description: {
        component:
          "Flexible page header component with support for leading/trailing elements, title/subtitle, and responsive behavior.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Basic: Story = {
  args: {
    title: "New Session",
  },
};

export const WithSubtitle: Story = {
  args: {
    title: "Dashboard",
    subtitle: "Welcome back to your workspace",
  },
};

export const WithMenuButton: Story = {
  render: () => {
    return (
      <PageHeader
        title="Settings"
        subtitle="Manage your preferences"
        leading={
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="w-5 h-5" />
          </Button>
        }
      />
    );
  },
};

export const WithBackButton: Story = {
  render: () => {
    return (
      <PageHeader
        title="Edit Profile"
        leading={
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        }
      />
    );
  },
};

export const WithActions: Story = {
  render: () => {
    return (
      <PageHeader
        title="Project Settings"
        subtitle="Configure your project"
        trailing={
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Advanced
          </Button>
        }
      />
    );
  },
};

export const WithTabNavigation: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState("chat");
    return (
      <PageHeader
        title="Agent Workspace"
        subtitle="deepractice-ai/project"
        trailing={
          <TabNavigation
            tabs={[
              { id: "chat", label: "Chat", icon: <MessageSquare className="w-4 h-4" /> },
              { id: "shell", label: "Shell", icon: <Terminal className="w-4 h-4" /> },
              { id: "files", label: "Files", icon: <Folder className="w-4 h-4" /> },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        }
      />
    );
  },
};

export const CompleteExample: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState("chat");
    return (
      <PageHeader
        title="New Session"
        subtitle="deepractice-ai/agent"
        leading={
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Menu className="w-5 h-5" />
          </Button>
        }
        trailing={
          <TabNavigation
            tabs={[
              { id: "chat", label: "Chat", icon: <MessageSquare className="w-4 h-4" /> },
              { id: "shell", label: "Shell", icon: <Terminal className="w-4 h-4" /> },
              { id: "files", label: "Files", icon: <Folder className="w-4 h-4" /> },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            iconOnlyMobile
          />
        }
      />
    );
  },
};

export const MobileMode: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState("chat");
    return (
      <div className="max-w-sm">
        <PageHeader
          title="Agent Chat"
          subtitle="deepractice-ai/project"
          leading={
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Menu className="w-5 h-5" />
            </Button>
          }
          trailing={
            <TabNavigation
              tabs={[
                { id: "chat", label: "Chat", icon: <MessageSquare className="w-4 h-4" /> },
                { id: "shell", label: "Shell", icon: <Terminal className="w-4 h-4" /> },
                { id: "files", label: "Files", icon: <Folder className="w-4 h-4" /> },
              ]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              iconOnlyMobile
            />
          }
          isMobile
        />
      </div>
    );
  },
};

export const NoBorder: Story = {
  args: {
    title: "Borderless Header",
    subtitle: "No bottom border",
    showBorder: false,
  },
};

export const AllVariants: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState("chat");

    return (
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium mb-3 text-foreground">Basic Header</p>
          <PageHeader title="Simple Title" />
        </div>

        <div>
          <p className="text-sm font-medium mb-3 text-foreground">With Subtitle</p>
          <PageHeader title="Main Title" subtitle="Additional context goes here" />
        </div>

        <div>
          <p className="text-sm font-medium mb-3 text-foreground">With Menu Button</p>
          <PageHeader
            title="Mobile Layout"
            subtitle="With hamburger menu"
            leading={
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-5 h-5" />
              </Button>
            }
          />
        </div>

        <div>
          <p className="text-sm font-medium mb-3 text-foreground">With Tab Navigation</p>
          <PageHeader
            title="Full Featured Header"
            subtitle="With all components"
            leading={
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-5 h-5" />
              </Button>
            }
            trailing={
              <TabNavigation
                tabs={[
                  { id: "chat", label: "Chat", icon: <MessageSquare className="w-4 h-4" /> },
                  { id: "shell", label: "Shell", icon: <Terminal className="w-4 h-4" /> },
                  { id: "files", label: "Files", icon: <Folder className="w-4 h-4" /> },
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            }
          />
        </div>
      </div>
    );
  },
};

export const UseCases: Story = {
  render: () => {
    const [chatTab, setChatTab] = useState("chat");

    return (
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium mb-3">Chat Application Header</p>
          <p className="text-xs text-muted-foreground mb-3">
            Typical header for a chat interface with session title and mode tabs
          </p>
          <PageHeader
            title="New Session"
            subtitle="Project: deepractice-ai/agent"
            leading={
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="w-5 h-5" />
              </Button>
            }
            trailing={
              <TabNavigation
                tabs={[
                  { id: "chat", label: "Chat", icon: <MessageSquare className="w-4 h-4" /> },
                  { id: "shell", label: "Shell", icon: <Terminal className="w-4 h-4" /> },
                  { id: "files", label: "Files", icon: <Folder className="w-4 h-4" /> },
                ]}
                activeTab={chatTab}
                onTabChange={setChatTab}
              />
            }
          />
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Settings Page Header</p>
          <p className="text-xs text-muted-foreground mb-3">
            Simple header with back button for detail pages
          </p>
          <PageHeader
            title="Account Settings"
            subtitle="Manage your account preferences"
            leading={
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            }
          />
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Dashboard Header</p>
          <p className="text-xs text-muted-foreground mb-3">Dashboard with action buttons</p>
          <PageHeader
            title="Analytics Dashboard"
            subtitle="Last updated: 2 minutes ago"
            trailing={
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Export
                </Button>
                <Button variant="default" size="sm">
                  Refresh
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  },
};
