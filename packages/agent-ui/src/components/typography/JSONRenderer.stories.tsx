import type { Meta, StoryObj } from "@storybook/react";
import { JSONRenderer } from "./JSONRenderer";

const meta: Meta<typeof JSONRenderer> = {
  title: "Content/JSONRenderer",
  component: JSONRenderer,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Format and display JSON content with syntax highlighting. Returns null for invalid JSON. Single responsibility: parse and render JSON.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof JSONRenderer>;

const simpleJSON = JSON.stringify({ name: "Agent", version: "1.0.0", active: true });

const complexJSON = JSON.stringify({
  user: {
    id: 123,
    name: "Alice",
    email: "alice@example.com",
    roles: ["admin", "user"],
    settings: {
      theme: "dark",
      notifications: true,
      language: "en",
    },
  },
  timestamp: "2024-01-14T10:30:00Z",
  metadata: {
    source: "api",
    version: 2,
  },
});

const apiResponseJSON = JSON.stringify({
  status: "success",
  data: {
    items: [
      { id: 1, title: "First Item", completed: false },
      { id: 2, title: "Second Item", completed: true },
      { id: 3, title: "Third Item", completed: false },
    ],
    total: 3,
    page: 1,
    perPage: 10,
  },
  message: "Data retrieved successfully",
});

export const Simple: Story = {
  args: {
    content: simpleJSON,
  },
};

export const Complex: Story = {
  args: {
    content: complexJSON,
  },
};

export const APIResponse: Story = {
  args: {
    content: apiResponseJSON,
  },
};

export const EmptyObject: Story = {
  args: {
    content: "{}",
  },
};

export const EmptyArray: Story = {
  args: {
    content: "[]",
  },
};

export const InvalidJSON: Story = {
  args: {
    content: "{ invalid json }",
  },
  parameters: {
    docs: {
      description: {
        story: "Returns null for invalid JSON - no error displayed",
      },
    },
  },
};

export const MultipleJSONBlocks: Story = {
  render: () => (
    <div className="space-y-4">
      <JSONRenderer content={simpleJSON} />
      <JSONRenderer content={complexJSON} />
      <JSONRenderer content={apiResponseJSON} />
    </div>
  ),
};

export const WithCustomStyling: Story = {
  render: () => (
    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-xl">
      <h3 className="text-lg font-semibold mb-4">API Response</h3>
      <JSONRenderer content={apiResponseJSON} className="shadow-lg" />
    </div>
  ),
};
