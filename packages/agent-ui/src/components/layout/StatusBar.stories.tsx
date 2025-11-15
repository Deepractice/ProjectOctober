import type { Meta, StoryObj } from "@storybook/react";
import { StatusBar, StatusBarSection, StatusBarItem } from "./StatusBar";
import { GitBranch, AlertCircle, CheckCircle, Wifi, WifiOff, Zap } from "lucide-react";

const meta: Meta<typeof StatusBar> = {
  title: "Layout/StatusBar",
  component: StatusBar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "VSCode-style bottom status bar. Displays global application state, connection status, errors, and other real-time information.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusBar>;

export const Default: Story = {
  render: () => (
    <div className="h-96 flex flex-col border border-border rounded-md overflow-hidden">
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">Application Content</p>
      </div>
      <StatusBar>
        <StatusBarSection align="left">
          <StatusBarItem icon={<GitBranch className="w-3 h-3" />}>main</StatusBarItem>
          <StatusBarItem icon={<CheckCircle className="w-3 h-3" />}>0 errors</StatusBarItem>
        </StatusBarSection>
        <StatusBarSection align="right">
          <StatusBarItem>Line 42, Col 8</StatusBarItem>
          <StatusBarItem>UTF-8</StatusBarItem>
        </StatusBarSection>
      </StatusBar>
    </div>
  ),
};

export const WithErrors: Story = {
  render: () => (
    <div className="h-96 flex flex-col border border-border rounded-md overflow-hidden">
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">Application Content</p>
      </div>
      <StatusBar>
        <StatusBarSection align="left">
          <StatusBarItem icon={<GitBranch className="w-3 h-3" />}>main</StatusBarItem>
          <StatusBarItem icon={<AlertCircle className="w-3 h-3" />} clickable>
            3 errors, 5 warnings
          </StatusBarItem>
          <StatusBarItem icon={<CheckCircle className="w-3 h-3" />}>Tests passing</StatusBarItem>
        </StatusBarSection>
        <StatusBarSection align="right">
          <StatusBarItem icon={<Wifi className="w-3 h-3" />}>Connected</StatusBarItem>
          <StatusBarItem>Line 42, Col 8</StatusBarItem>
        </StatusBarSection>
      </StatusBar>
    </div>
  ),
};

export const Disconnected: Story = {
  render: () => (
    <div className="h-96 flex flex-col border border-border rounded-md overflow-hidden">
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">Application Content</p>
      </div>
      <StatusBar>
        <StatusBarSection align="left">
          <StatusBarItem icon={<WifiOff className="w-3 h-3" />} clickable>
            Disconnected - Click to reconnect
          </StatusBarItem>
        </StatusBarSection>
        <StatusBarSection align="right">
          <StatusBarItem>Offline mode</StatusBarItem>
        </StatusBarSection>
      </StatusBar>
    </div>
  ),
};

export const WithCenter: Story = {
  render: () => (
    <div className="h-96 flex flex-col border border-border rounded-md overflow-hidden">
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">Application Content</p>
      </div>
      <StatusBar>
        <StatusBarSection align="left">
          <StatusBarItem icon={<GitBranch className="w-3 h-3" />}>main</StatusBarItem>
        </StatusBarSection>
        <StatusBarSection align="center">
          <StatusBarItem icon={<Zap className="w-3 h-3" />}>Building... 45%</StatusBarItem>
        </StatusBarSection>
        <StatusBarSection align="right">
          <StatusBarItem>Line 42, Col 8</StatusBarItem>
        </StatusBarSection>
      </StatusBar>
    </div>
  ),
};

export const Detailed: Story = {
  render: () => (
    <div className="h-96 flex flex-col border border-border rounded-md overflow-hidden">
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">Code Editor</p>
      </div>
      <StatusBar>
        <StatusBarSection align="left">
          <StatusBarItem icon={<GitBranch className="w-3 h-3" />} clickable>
            main
          </StatusBarItem>
          <StatusBarItem icon={<CheckCircle className="w-3 h-3" />} clickable>
            0 errors
          </StatusBarItem>
          <StatusBarItem icon={<AlertCircle className="w-3 h-3" />} clickable>
            2 warnings
          </StatusBarItem>
          <StatusBarItem clickable>TypeScript</StatusBarItem>
        </StatusBarSection>
        <StatusBarSection align="right">
          <StatusBarItem icon={<Wifi className="w-3 h-3" />}>Connected</StatusBarItem>
          <StatusBarItem clickable>Spaces: 2</StatusBarItem>
          <StatusBarItem clickable>UTF-8</StatusBarItem>
          <StatusBarItem clickable>LF</StatusBarItem>
          <StatusBarItem clickable>Line 42, Col 8</StatusBarItem>
        </StatusBarSection>
      </StatusBar>
    </div>
  ),
};

export const CustomHeight: Story = {
  render: () => (
    <div className="h-96 flex flex-col border border-border rounded-md overflow-hidden">
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <p className="text-muted-foreground">Application Content</p>
      </div>
      <StatusBar height={32}>
        <StatusBarSection align="left">
          <StatusBarItem icon={<GitBranch className="w-4 h-4" />}>main</StatusBarItem>
          <StatusBarItem icon={<CheckCircle className="w-4 h-4" />}>
            All systems operational
          </StatusBarItem>
        </StatusBarSection>
        <StatusBarSection align="right">
          <StatusBarItem icon={<Wifi className="w-4 h-4" />}>Connected</StatusBarItem>
        </StatusBarSection>
      </StatusBar>
    </div>
  ),
};

export const InFullLayout: Story = {
  render: () => (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Application Content</h2>
          <p className="text-muted-foreground">Status bar is fixed at the bottom</p>
        </div>
      </div>
      <StatusBar>
        <StatusBarSection align="left">
          <StatusBarItem icon={<GitBranch className="w-3 h-3" />} clickable>
            main
          </StatusBarItem>
          <StatusBarItem icon={<CheckCircle className="w-3 h-3" />}>No issues</StatusBarItem>
        </StatusBarSection>
        <StatusBarSection align="center">
          <StatusBarItem icon={<Zap className="w-3 h-3" />}>Ready</StatusBarItem>
        </StatusBarSection>
        <StatusBarSection align="right">
          <StatusBarItem icon={<Wifi className="w-3 h-3" />}>Online</StatusBarItem>
          <StatusBarItem>12:34 PM</StatusBarItem>
        </StatusBarSection>
      </StatusBar>
    </div>
  ),
};
