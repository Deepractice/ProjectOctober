import type { Meta, StoryObj } from "@storybook/react";
import { Panel } from "./Panel";
import { MainContent } from "./MainContent";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { Terminal, FileText, AlertCircle } from "lucide-react";

const meta: Meta<typeof Panel> = {
  title: "Layout/Panel",
  component: Panel,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A resizable bottom panel container for terminal, output, logs, etc. Use with Allotment vertical for drag-to-resize functionality.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Panel>;

export const Default: Story = {
  render: () => (
    <div className="h-96 border border-border rounded-md overflow-hidden">
      <Allotment vertical>
        <Allotment.Pane>
          <MainContent>
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Main Content</p>
            </div>
          </MainContent>
        </Allotment.Pane>
        <Allotment.Pane minSize={100} maxSize={500} preferredSize={200}>
          <Panel>
            <div className="p-4">
              <h3 className="font-semibold mb-2">Panel Content</h3>
              <p className="text-sm text-muted-foreground">Drag the divider to resize this panel</p>
            </div>
          </Panel>
        </Allotment.Pane>
      </Allotment>
    </div>
  ),
};

export const TerminalPanel: Story = {
  render: () => (
    <div className="h-96 border border-border rounded-md overflow-hidden">
      <Allotment vertical>
        <Allotment.Pane>
          <MainContent>
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Editor Area</p>
            </div>
          </MainContent>
        </Allotment.Pane>
        <Allotment.Pane minSize={100} maxSize={500} preferredSize={250}>
          <Panel>
            <div className="flex flex-col h-full">
              {/* Panel Header */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
                <Terminal className="w-4 h-4" />
                <span className="text-sm font-medium">Terminal</span>
              </div>

              {/* Terminal Content */}
              <div className="flex-1 overflow-y-auto p-4 font-mono text-xs bg-black text-green-400">
                <div>$ npm run dev</div>
                <div className="mt-2 text-gray-400">Starting development server...</div>
                <div className="text-gray-400">Server running at http://localhost:3000</div>
                <div className="mt-2">
                  <span className="text-green-400">✓</span> Ready in 234ms
                </div>
                <div className="mt-4 flex">
                  <span>$ </span>
                  <span className="animate-pulse">_</span>
                </div>
              </div>
            </div>
          </Panel>
        </Allotment.Pane>
      </Allotment>
    </div>
  ),
};

export const OutputLog: Story = {
  render: () => (
    <div className="h-96 border border-border rounded-md overflow-hidden">
      <Allotment vertical>
        <Allotment.Pane>
          <MainContent>
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Application</p>
            </div>
          </MainContent>
        </Allotment.Pane>
        <Allotment.Pane minSize={100} maxSize={500} preferredSize={200}>
          <Panel>
            <div className="flex flex-col h-full">
              {/* Panel Header */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Output</span>
              </div>

              {/* Output Content */}
              <div className="flex-1 overflow-y-auto p-4 text-xs font-mono space-y-1">
                <div className="text-blue-600">[INFO] Application started</div>
                <div className="text-blue-600">[INFO] Loading configuration...</div>
                <div className="text-green-600">[SUCCESS] Configuration loaded</div>
                <div className="text-blue-600">[INFO] Connecting to database...</div>
                <div className="text-green-600">[SUCCESS] Database connected</div>
                <div className="text-yellow-600">[WARN] Deprecated API usage detected</div>
                <div className="text-blue-600">[INFO] Server listening on port 3000</div>
              </div>
            </div>
          </Panel>
        </Allotment.Pane>
      </Allotment>
    </div>
  ),
};

export const Problems: Story = {
  render: () => (
    <div className="h-96 border border-border rounded-md overflow-hidden">
      <Allotment vertical>
        <Allotment.Pane>
          <MainContent>
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Code Editor</p>
            </div>
          </MainContent>
        </Allotment.Pane>
        <Allotment.Pane minSize={100} maxSize={500} preferredSize={180}>
          <Panel>
            <div className="flex flex-col h-full">
              {/* Panel Header */}
              <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Problems</span>
                <span className="ml-auto text-xs text-muted-foreground">3 errors</span>
              </div>

              {/* Problems List */}
              <div className="flex-1 overflow-y-auto">
                {[
                  { file: "index.tsx", line: 42, message: "Property 'name' does not exist" },
                  { file: "App.tsx", line: 18, message: "Expected 2 arguments, but got 1" },
                  {
                    file: "utils.ts",
                    line: 5,
                    message: "Type 'string' is not assignable to type 'number'",
                  },
                ].map((problem, i) => (
                  <div
                    key={i}
                    className="px-4 py-2 hover:bg-accent cursor-pointer border-b border-border last:border-0"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{problem.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {problem.file}:{problem.line}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        </Allotment.Pane>
      </Allotment>
    </div>
  ),
};

export const Collapsible: Story = {
  render: () => (
    <div className="h-96 border border-border rounded-md overflow-hidden">
      <Allotment vertical>
        <Allotment.Pane>
          <MainContent>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-muted-foreground mb-2">Main Content</p>
                <p className="text-sm text-muted-foreground">
                  Double-click the divider to collapse/expand the panel
                </p>
              </div>
            </div>
          </MainContent>
        </Allotment.Pane>
        <Allotment.Pane minSize={100} maxSize={500} preferredSize={200} snap>
          <Panel>
            <div className="p-4">
              <h3 className="font-semibold mb-2">Collapsible Panel</h3>
              <p className="text-sm text-muted-foreground">
                This panel can be collapsed by double-clicking the divider
              </p>
            </div>
          </Panel>
        </Allotment.Pane>
      </Allotment>
    </div>
  ),
};
