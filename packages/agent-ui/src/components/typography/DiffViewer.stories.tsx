import type { Meta, StoryObj } from "@storybook/react";
import { DiffViewer } from "./DiffViewer";

const meta: Meta<typeof DiffViewer> = {
  title: "Content/DiffViewer",
  component: DiffViewer,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "Display code diffs with color-coded additions (green), deletions (red), and headers (blue). Single responsibility: render diff content.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof DiffViewer>;

const simpleDiff = `@@ -1,3 +1,3 @@
 function hello() {
-  console.log('Hello');
+  console.log('Hello World');
 }`;

const complexDiff = `@@ -10,15 +10,18 @@ import { Agent } from '@deepractice-ai/agent-sdk';

 export function createAgent(config: AgentConfig) {
   const agent = new Agent({
-    apiKey: process.env.ANTHROPIC_API_KEY,
+    apiKey: config.apiKey || process.env.ANTHROPIC_API_KEY,
     model: 'claude-3-5-sonnet-20241022',
+    maxTokens: config.maxTokens || 8192,
   });

-  // Initialize session
-  const session = agent.createSession();
+  // Initialize session with custom name
+  const session = agent.createSession({
+    name: config.sessionName || 'Default Session',
+    persist: true,
+  });

   return { agent, session };
 }`;

const multiFileDiff = `diff --git a/src/index.ts b/src/index.ts
index 1234567..abcdefg 100644
--- a/src/index.ts
+++ b/src/index.ts
@@ -1,5 +1,6 @@
 export { Agent } from './Agent';
 export { Session } from './Session';
+export { Message } from './Message';
 export type { AgentConfig } from './types';

 // Re-export SDK types
diff --git a/src/types.ts b/src/types.ts
index 7654321..fedcba9 100644
--- a/src/types.ts
+++ b/src/types.ts
@@ -5,6 +5,7 @@ export interface AgentConfig {
   model?: string;
   maxTokens?: number;
   temperature?: number;
+  topP?: number;
 }`;

const additionOnlyDiff = `@@ -0,0 +1,10 @@
+export function newFeature() {
+  const config = {
+    enabled: true,
+    mode: 'advanced',
+  };
+
+  console.log('New feature initialized');
+  return config;
+}`;

const deletionOnlyDiff = `@@ -15,10 +15,0 @@
-function deprecatedFunction() {
-  console.warn('This function is deprecated');
-  // Old implementation
-  return null;
-}`;

export const Simple: Story = {
  args: {
    diff: simpleDiff,
  },
};

export const Complex: Story = {
  args: {
    diff: complexDiff,
  },
};

export const MultiFile: Story = {
  args: {
    diff: multiFileDiff,
  },
};

export const AdditionOnly: Story = {
  args: {
    diff: additionOnlyDiff,
  },
};

export const DeletionOnly: Story = {
  args: {
    diff: deletionOnlyDiff,
  },
};

export const EmptyDiff: Story = {
  args: {
    diff: "",
  },
};

export const WithTextWrapping: Story = {
  args: {
    diff: complexDiff,
    isMobile: true,
    wrapText: true,
  },
};

export const MultipleDiffs: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold mb-2">Simple Change</h3>
        <DiffViewer diff={simpleDiff} />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Addition</h3>
        <DiffViewer diff={additionOnlyDiff} />
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-2">Deletion</h3>
        <DiffViewer diff={deletionOnlyDiff} />
      </div>
    </div>
  ),
};

export const InMessageContext: Story = {
  render: () => (
    <div className="max-w-3xl p-6 bg-slate-50 dark:bg-slate-900 rounded-xl">
      <div className="mb-3">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
          Agent made changes to
        </span>
        <code className="ml-2 text-sm font-mono text-blue-600 dark:text-blue-400">
          src/index.ts
        </code>
      </div>
      <DiffViewer diff={complexDiff} />
    </div>
  ),
};
