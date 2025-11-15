import type { Meta, StoryObj } from "@storybook/react";
import { UserMessage } from "./UserMessage";

const meta: Meta<typeof UserMessage> = {
  title: "Message/UserMessage",
  component: UserMessage,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "User message bubble with amber background (generative/user input color). Supports text, images, and grouped mode. Single responsibility: render user message.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UserMessage>;

const now = new Date().toISOString();

export const Simple: Story = {
  args: {
    content: "Hello, can you help me with my code?",
    timestamp: now,
  },
};

export const LongText: Story = {
  args: {
    content:
      "I'm working on a React application and I need to implement a feature that allows users to upload images. The images should be displayed in a grid layout with a maximum of 4 images per row. Can you help me with the implementation?",
    timestamp: now,
  },
};

export const WithLineBreaks: Story = {
  args: {
    content:
      "Here's my question:\n\n1. How do I implement this?\n2. What's the best practice?\n3. Any examples?",
    timestamp: now,
  },
};

export const Grouped: Story = {
  args: {
    content: "This is a grouped message (avatar hidden)",
    timestamp: now,
    isGrouped: true,
  },
};

export const WithSingleImage: Story = {
  args: {
    content: "Check out this screenshot",
    timestamp: now,
    images: [
      {
        data: "https://via.placeholder.com/400x300/f59e0b/ffffff?text=Screenshot",
        name: "screenshot.png",
      },
    ],
  },
};

export const WithMultipleImages: Story = {
  args: {
    content: "Here are the designs I mentioned",
    timestamp: now,
    images: [
      {
        data: "https://via.placeholder.com/300x200/f59e0b/ffffff?text=Image+1",
        name: "design-1.png",
      },
      {
        data: "https://via.placeholder.com/300x200/f59e0b/ffffff?text=Image+2",
        name: "design-2.png",
      },
      {
        data: "https://via.placeholder.com/300x200/f59e0b/ffffff?text=Image+3",
        name: "design-3.png",
      },
      {
        data: "https://via.placeholder.com/300x200/f59e0b/ffffff?text=Image+4",
        name: "design-4.png",
      },
    ],
  },
};

export const Conversation: Story = {
  render: () => (
    <div className="space-y-3 max-w-3xl">
      <UserMessage content="Hi, I need help" timestamp={now} />
      <UserMessage
        content="Can you review this code?"
        timestamp={new Date(Date.now() + 5000).toISOString()}
        isGrouped
      />
      <UserMessage
        content="Here's the screenshot"
        timestamp={new Date(Date.now() + 10000).toISOString()}
        isGrouped
        images={[
          {
            data: "https://via.placeholder.com/400x300/f59e0b/ffffff?text=Code+Screenshot",
            name: "code.png",
          },
        ]}
      />
    </div>
  ),
};

export const DifferentLengths: Story = {
  render: () => (
    <div className="space-y-3 max-w-3xl">
      <UserMessage content="Short" timestamp={now} />
      <UserMessage
        content="Medium length message here"
        timestamp={new Date(Date.now() + 5000).toISOString()}
      />
      <UserMessage
        content="This is a much longer message that demonstrates how the message bubble adapts to different content lengths and wraps text appropriately."
        timestamp={new Date(Date.now() + 10000).toISOString()}
      />
    </div>
  ),
};

export const ResponsiveDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-sm text-slate-600 mb-2">
        Resize window to see responsive behavior (avatar hides on mobile)
      </div>
      <UserMessage
        content="This message shows responsive behavior - the avatar hides on mobile screens"
        timestamp={now}
      />
    </div>
  ),
};

export const InChatContext: Story = {
  render: () => (
    <div className="max-w-4xl mx-auto p-4 bg-slate-50 dark:bg-slate-900 rounded-lg min-h-96">
      <div className="space-y-4">
        <div className="flex justify-start">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-2 max-w-md">
            <p className="text-sm">Hello! How can I help you today?</p>
          </div>
        </div>

        <UserMessage content="I need help implementing a dark mode toggle" timestamp={now} />

        <div className="flex justify-start">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-bl-md px-4 py-2 max-w-md">
            <p className="text-sm">I'd be happy to help with that! Let me show you...</p>
          </div>
        </div>

        <UserMessage
          content="Great! Can you also add a theme switcher?"
          timestamp={new Date(Date.now() + 5000).toISOString()}
          isGrouped
        />

        <UserMessage
          content="Here's my current implementation"
          timestamp={new Date(Date.now() + 10000).toISOString()}
          isGrouped
          images={[
            {
              data: "https://via.placeholder.com/500x300/f59e0b/ffffff?text=Current+Code",
              name: "current-code.png",
            },
          ]}
        />
      </div>
    </div>
  ),
};
