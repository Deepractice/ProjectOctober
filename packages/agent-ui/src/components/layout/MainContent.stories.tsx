import type { Meta, StoryObj } from "@storybook/react";
import { MainContent } from "./MainContent";

const meta: Meta<typeof MainContent> = {
  title: "Layout/MainContent",
  component: MainContent,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Main content area container. This is where your primary application content lives (chat, editor, dashboard, etc.).",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MainContent>;

export const Default: Story = {
  render: () => (
    <div className="h-96 border border-border rounded-md overflow-hidden">
      <MainContent>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Main Content Area</h2>
            <p className="text-muted-foreground">Your primary content goes here</p>
          </div>
        </div>
      </MainContent>
    </div>
  ),
};

export const WithHeader: Story = {
  render: () => (
    <div className="h-96 border border-border rounded-md overflow-hidden">
      <MainContent>
        {/* Header */}
        <div className="border-b border-border p-4">
          <h1 className="text-lg font-semibold">Document Title</h1>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <p className="mb-4">
            This is a main content area with a fixed header and scrollable content.
          </p>
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i} className="mb-2">
              Content paragraph {i + 1}
            </p>
          ))}
        </div>
      </MainContent>
    </div>
  ),
};

export const ChatInterface: Story = {
  render: () => (
    <div className="h-96 border border-border rounded-md overflow-hidden">
      <MainContent>
        {/* Chat Header */}
        <div className="border-b border-border p-4">
          <h2 className="font-semibold">Chat Session</h2>
          <p className="text-sm text-muted-foreground">Active conversation</p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
              U
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">User</p>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">Hello, how can you help me today?</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-semibold">
              AI
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium mb-1">Assistant</p>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm">I'm here to help! What would you like to know?</p>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4">
          <input
            type="text"
            placeholder="Type a message..."
            className="w-full px-3 py-2 border border-border rounded-md"
          />
        </div>
      </MainContent>
    </div>
  ),
};
