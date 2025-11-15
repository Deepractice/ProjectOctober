import type { Meta, StoryObj } from "@storybook/react";
import { MarkdownText } from "./MarkdownText";

const meta: Meta<typeof MarkdownText> = {
  title: "Content/MarkdownText",
  component: MarkdownText,
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: "text",
      description: "Markdown content to render",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;
type Story = StoryObj<typeof MarkdownText>;

export const BasicText: Story = {
  args: {
    children: "This is a simple paragraph with **bold** and *italic* text.",
  },
};

export const Headings: Story = {
  args: {
    children: `# Heading 1
## Heading 2
### Heading 3
#### Heading 4

This is regular text under headings.`,
  },
};

export const InlineCode: Story = {
  args: {
    children: "Here is some `inline code` in a sentence.",
  },
};

export const CodeBlock: Story = {
  args: {
    children: `Here is a code block with copy functionality:

\`\`\`typescript
function hello(name: string): string {
  return \`Hello, \${name}!\`;
}

const greeting = hello("World");
console.log(greeting);
\`\`\`

Hover over the code block to see the copy button.`,
  },
};

export const Lists: Story = {
  args: {
    children: `## Unordered List

- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3

## Ordered List

1. First item
2. Second item
3. Third item`,
  },
};

export const Links: Story = {
  args: {
    children: `Check out [Deepractice AI](https://deepractice.ai) for more information.

You can also visit [GitHub](https://github.com) or [npm](https://npmjs.com).`,
  },
};

export const Blockquote: Story = {
  args: {
    children: `> This is a blockquote.
> It can span multiple lines.
>
> And can contain **formatting**.`,
  },
};

export const Table: Story = {
  args: {
    children: `| Feature | Status | Notes |
|---------|--------|-------|
| Markdown | ✅ | Full support |
| Code highlighting | ✅ | With copy button |
| Tables | ✅ | GFM support |
| Math | ❌ | Not yet |`,
  },
};

export const MixedContent: Story = {
  args: {
    children: `# AI Agent Response

I can help you with that! Here's a TypeScript function:

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function createUser(name: string, email: string): User {
  return {
    id: Math.random().toString(36),
    name,
    email,
  };
}
\`\`\`

**Key features:**
- Type-safe interface
- Random ID generation
- Simple and clean

> Note: In production, use a proper UUID library like \`uuid\`.

For more details, check the [TypeScript documentation](https://www.typescriptlang.org/).`,
  },
};

export const MultipleCodeBlocks: Story = {
  args: {
    children: `## JavaScript Example

\`\`\`javascript
const result = array.map(x => x * 2);
\`\`\`

## Python Example

\`\`\`python
result = [x * 2 for x in array]
\`\`\`

## Shell Example

\`\`\`bash
echo "Hello World"
ls -la
\`\`\``,
  },
};

export const TaskList: Story = {
  args: {
    children: `## Todo List

- [x] Complete task 1
- [x] Complete task 2
- [ ] Pending task 3
- [ ] Pending task 4`,
  },
};

export const EmptyContent: Story = {
  args: {
    children: "",
  },
};

export const ProseStyled: Story = {
  args: {
    children: `# Beautiful Typography

This example uses Tailwind's prose classes for optimal reading experience.

## Introduction

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

### Key Points

1. First important point
2. Second important point
3. Third important point

> "The best way to predict the future is to invent it." - Alan Kay`,
    className: "prose prose-sm max-w-none dark:prose-invert prose-gray",
  },
};
