import type { Meta, StoryObj } from "@storybook/react";
import { AssistantMessage } from "./AssistantMessage";

const meta: Meta<typeof AssistantMessage> = {
  title: "Message/AssistantMessage",
  component: AssistantMessage,
  tags: ["autodocs"],
  argTypes: {
    content: {
      control: "text",
      description: "Message content (text, markdown, or JSON)",
    },
    timestamp: {
      control: "text",
      description: "Message timestamp",
    },
    reasoning: {
      control: "text",
      description: "Extended thinking content",
    },
    showThinking: {
      control: "boolean",
      description: "Whether to show thinking section",
    },
    messageType: {
      control: "select",
      options: ["assistant", "error"],
      description: "Message type",
    },
    isGrouped: {
      control: "boolean",
      description: "Whether message is grouped",
    },
  },
};

export default meta;
type Story = StoryObj<typeof AssistantMessage>;

const now = new Date().toISOString();

export const SimpleText: Story = {
  args: {
    content: "Hello! I'm here to help you with your questions.",
    timestamp: now,
    messageType: "assistant",
  },
};

export const MarkdownContent: Story = {
  args: {
    content: `Here's a detailed explanation:

## Key Points

1. **Important concept**: This is crucial to understand
2. **Another point**: With some emphasis
3. Regular point without formatting

You can also use \`inline code\` like this.`,
    timestamp: now,
    messageType: "assistant",
  },
};

export const CodeBlock: Story = {
  args: {
    content: `Here's a TypeScript example:

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}
\`\`\`

This code demonstrates a simple interface and function.`,
    timestamp: now,
    messageType: "assistant",
  },
};

export const JSONContent: Story = {
  args: {
    content: JSON.stringify(
      {
        status: "success",
        data: {
          id: "123",
          name: "John Doe",
          email: "john@example.com",
          preferences: {
            theme: "dark",
            language: "en",
          },
        },
      },
      null,
      2
    ),
    timestamp: now,
    messageType: "assistant",
  },
};

export const WithThinking: Story = {
  args: {
    content: "Based on my analysis, I recommend using TypeScript for this project.",
    timestamp: now,
    reasoning:
      "I considered several factors:\n1. Type safety requirements\n2. Team experience\n3. Project complexity\n4. Long-term maintainability\n\nTypeScript provides the best balance of these factors.",
    showThinking: true,
    messageType: "assistant",
  },
};

export const ThinkingHidden: Story = {
  args: {
    content: "Based on my analysis, I recommend using TypeScript for this project.",
    timestamp: now,
    reasoning: "This reasoning is hidden because showThinking is false",
    showThinking: false,
    messageType: "assistant",
  },
};

export const ErrorMessage: Story = {
  args: {
    content: "Error: Unable to process your request. Please try again later.",
    timestamp: now,
    messageType: "error",
  },
};

export const GroupedMessage: Story = {
  args: {
    content: "This message is grouped with the previous one.",
    timestamp: now,
    messageType: "assistant",
    isGrouped: true,
  },
  parameters: {
    docs: {
      description: {
        story: "When grouped, the timestamp is hidden by default and only appears on hover.",
      },
    },
  },
};

export const LongContent: Story = {
  args: {
    content: `# Comprehensive Guide to React Components

## Introduction

React is a JavaScript library for building user interfaces. It lets you compose complex UIs from small, isolated pieces of code called "components".

## Core Concepts

### 1. Components

Components are the building blocks of React applications. They can be:

- **Function Components**: Simple JavaScript functions that return JSX
- **Class Components**: ES6 classes that extend React.Component

### 2. Props

Props (short for properties) are how you pass data from parent to child components:

\`\`\`typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
}

function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
\`\`\`

### 3. State

State is data that changes over time:

\`\`\`typescript
const [count, setCount] = useState(0);
\`\`\`

## Best Practices

1. Keep components small and focused
2. Use TypeScript for type safety
3. Follow the single responsibility principle
4. Write unit tests for your components

> **Pro tip**: Always start with function components and hooks. Only use class components when absolutely necessary.

## Conclusion

React's component-based architecture makes it easy to build scalable and maintainable applications.`,
    timestamp: now,
    messageType: "assistant",
  },
};

export const MultipleCodeBlocks: Story = {
  args: {
    content: `I can help you with both JavaScript and Python:

**JavaScript version:**

\`\`\`javascript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
console.log(doubled); // [2, 4, 6, 8, 10]
\`\`\`

**Python version:**

\`\`\`python
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
print(doubled)  # [2, 4, 6, 8, 10]
\`\`\`

Both approaches achieve the same result!`,
    timestamp: now,
    messageType: "assistant",
  },
};

export const UsageLimitMessage: Story = {
  args: {
    content: `Agent AI usage limit reached|${Math.floor(Date.now() / 1000) + 3600}`,
    timestamp: now,
    messageType: "assistant",
  },
  parameters: {
    docs: {
      description: {
        story:
          "The formatUsageLimitText utility automatically formats usage limit messages with local timezone.",
      },
    },
  },
};

export const MixedContentTypes: Story = {
  args: {
    content: `I found the following results:

## Analysis

The data shows **3 critical issues**:

1. Memory leak in component A
2. Performance bottleneck in function B
3. Security vulnerability in module C

### Detailed Breakdown

\`\`\`json
{
  "severity": "high",
  "issues": 3,
  "resolved": 1
}
\`\`\`

> **Note**: All issues have been documented in the tracking system.

Next steps:
- Fix memory leak
- Optimize function B
- Apply security patch`,
    timestamp: now,
    messageType: "assistant",
  },
};
