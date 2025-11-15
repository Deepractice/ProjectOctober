import type { Meta, StoryObj } from "@storybook/react";
import { ThinkingSection } from "./ThinkingSection";

const meta: Meta<typeof ThinkingSection> = {
  title: "Message/ThinkingSection",
  component: ThinkingSection,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Collapsible panel for displaying AI's extended thinking/reasoning process. Single responsibility: render expandable thinking content.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ThinkingSection>;

const shortReasoning =
  "First, I need to analyze the user's request to understand what they're asking for.";

const longReasoning = `First, I need to analyze the user's request to understand what they're asking for.

The user wants to implement a feature that allows users to track their usage metrics. This involves:
1. Collecting data points about user activity
2. Storing this data in a structured format
3. Providing export functionality in multiple formats

I should break this down into smaller components:
- A metrics collection service
- A data storage layer
- Export formatters (CSV, JSON, PDF)

Let me start by designing the metrics collection interface...`;

const codeReasoning = `I notice the function is using Array.prototype.map() which is appropriate for this use case.

However, there's a potential performance issue:
- The nested loop creates O(n²) complexity
- For large datasets, this could be slow

Better approach:
1. Create a hash map for O(1) lookups
2. Single pass through the array
3. Result: O(n) time complexity

Code example:
const map = new Map();
items.forEach(item => map.set(item.id, item));
return ids.map(id => map.get(id));`;

export const Short: Story = {
  args: {
    reasoning: shortReasoning,
  },
};

export const Long: Story = {
  args: {
    reasoning: longReasoning,
  },
};

export const WithCode: Story = {
  args: {
    reasoning: codeReasoning,
  },
};

export const InMessageContext: Story = {
  render: () => (
    <div className="max-w-3xl space-y-4">
      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
        <ThinkingSection reasoning={longReasoning} />
        <div className="prose prose-sm dark:prose-invert">
          <p>Based on my analysis, here's the implementation plan...</p>
          <ol>
            <li>Create metrics collection service</li>
            <li>Implement storage layer</li>
            <li>Add export functionality</li>
          </ol>
        </div>
      </div>
    </div>
  ),
};

export const MultipleThinkingSections: Story = {
  render: () => (
    <div className="max-w-3xl space-y-4">
      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
        <ThinkingSection reasoning="Initial analysis of the problem..." />
        <p className="text-sm text-slate-700 dark:text-slate-300 my-3">
          I'll start by examining the code structure.
        </p>
        <ThinkingSection reasoning="After reviewing the codebase, I found several optimization opportunities..." />
        <p className="text-sm text-slate-700 dark:text-slate-300 my-3">
          Here are my recommendations:
        </p>
      </div>
    </div>
  ),
};

export const InteractiveDemo: Story = {
  render: () => (
    <div className="space-y-3">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Click on "Thinking..." to expand/collapse
      </p>
      <ThinkingSection reasoning={shortReasoning} />
      <ThinkingSection reasoning={longReasoning} />
      <ThinkingSection reasoning={codeReasoning} />
    </div>
  ),
};
