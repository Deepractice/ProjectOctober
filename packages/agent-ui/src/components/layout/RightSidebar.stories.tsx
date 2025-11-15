import type { Meta, StoryObj } from "@storybook/react";
import { RightSidebar } from "./RightSidebar";
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { FileText, Settings, Eye } from "lucide-react";

const meta: Meta<typeof RightSidebar> = {
  title: "Layout/RightSidebar",
  component: RightSidebar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A resizable right sidebar container for outline, properties, preview, etc. Use with Allotment for drag-to-resize functionality.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RightSidebar>;

export const Default: Story = {
  render: () => (
    <div className="h-96 border border-border rounded-md overflow-hidden">
      <Allotment>
        <Allotment.Pane>
          <div className="h-full flex items-center justify-center bg-muted/20">
            <p className="text-muted-foreground">Main Content</p>
          </div>
        </Allotment.Pane>
        <Allotment.Pane minSize={200} maxSize={600} preferredSize={300}>
          <RightSidebar>
            <div className="p-4">
              <h3 className="font-semibold mb-2">Right Sidebar</h3>
              <p className="text-sm text-muted-foreground">
                Drag the divider to resize this sidebar
              </p>
            </div>
          </RightSidebar>
        </Allotment.Pane>
      </Allotment>
    </div>
  ),
};

export const Outline: Story = {
  render: () => (
    <div className="h-96 border border-border rounded-md overflow-hidden">
      <Allotment>
        <Allotment.Pane>
          <div className="h-full flex items-center justify-center bg-muted/20">
            <p className="text-muted-foreground">Document Editor</p>
          </div>
        </Allotment.Pane>
        <Allotment.Pane minSize={200} maxSize={600} preferredSize={280}>
          <RightSidebar>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center gap-2 p-4 border-b border-border">
                <FileText className="w-4 h-4" />
                <h3 className="text-sm font-semibold">Outline</h3>
              </div>

              {/* Outline Tree */}
              <div className="flex-1 overflow-y-auto p-2">
                <div className="space-y-1">
                  <div className="px-3 py-2 text-sm font-medium">Introduction</div>
                  <div className="px-3 py-2 pl-6 text-sm hover:bg-accent rounded-md cursor-pointer">
                    Overview
                  </div>
                  <div className="px-3 py-2 pl-6 text-sm hover:bg-accent rounded-md cursor-pointer">
                    Getting Started
                  </div>
                  <div className="px-3 py-2 text-sm font-medium mt-2">Core Concepts</div>
                  <div className="px-3 py-2 pl-6 text-sm hover:bg-accent rounded-md cursor-pointer">
                    Components
                  </div>
                  <div className="px-3 py-2 pl-6 text-sm hover:bg-accent rounded-md cursor-pointer">
                    State Management
                  </div>
                  <div className="px-3 py-2 pl-9 text-sm hover:bg-accent rounded-md cursor-pointer">
                    useState
                  </div>
                  <div className="px-3 py-2 pl-9 text-sm hover:bg-accent rounded-md cursor-pointer">
                    useEffect
                  </div>
                  <div className="px-3 py-2 text-sm font-medium mt-2">Advanced</div>
                  <div className="px-3 py-2 pl-6 text-sm hover:bg-accent rounded-md cursor-pointer">
                    Performance
                  </div>
                </div>
              </div>
            </div>
          </RightSidebar>
        </Allotment.Pane>
      </Allotment>
    </div>
  ),
};

export const Properties: Story = {
  render: () => (
    <div className="h-96 border border-border rounded-md overflow-hidden">
      <Allotment>
        <Allotment.Pane>
          <div className="h-full flex items-center justify-center bg-muted/20">
            <div className="w-32 h-32 bg-primary rounded-lg"></div>
          </div>
        </Allotment.Pane>
        <Allotment.Pane minSize={200} maxSize={600} preferredSize={320}>
          <RightSidebar>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center gap-2 p-4 border-b border-border">
                <Settings className="w-4 h-4" />
                <h3 className="text-sm font-semibold">Properties</h3>
              </div>

              {/* Properties List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Width</label>
                  <input
                    type="number"
                    defaultValue={128}
                    className="w-full mt-1 px-2 py-1 text-sm border border-border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Height</label>
                  <input
                    type="number"
                    defaultValue={128}
                    className="w-full mt-1 px-2 py-1 text-sm border border-border rounded"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Color</label>
                  <div className="flex gap-2 mt-1">
                    <div className="w-8 h-8 bg-blue-500 rounded border border-border cursor-pointer"></div>
                    <div className="w-8 h-8 bg-green-500 rounded border border-border cursor-pointer"></div>
                    <div className="w-8 h-8 bg-red-500 rounded border border-border cursor-pointer"></div>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Opacity</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue={100}
                    className="w-full mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Border Radius</label>
                  <input type="range" min="0" max="32" defaultValue={8} className="w-full mt-1" />
                </div>
              </div>
            </div>
          </RightSidebar>
        </Allotment.Pane>
      </Allotment>
    </div>
  ),
};

export const Preview: Story = {
  render: () => (
    <div className="h-96 border border-border rounded-md overflow-hidden">
      <Allotment>
        <Allotment.Pane>
          <div className="h-full flex items-center justify-center bg-muted/20 p-8">
            <div className="w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Markdown Editor</h2>
              <textarea
                className="w-full h-48 p-3 border border-border rounded-md font-mono text-sm"
                defaultValue="# Hello World\n\nThis is **bold** text."
              />
            </div>
          </div>
        </Allotment.Pane>
        <Allotment.Pane minSize={200} maxSize={600} preferredSize={350}>
          <RightSidebar>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center gap-2 p-4 border-b border-border">
                <Eye className="w-4 h-4" />
                <h3 className="text-sm font-semibold">Preview</h3>
              </div>

              {/* Preview Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <h1 className="text-3xl font-bold mb-4">Hello World</h1>
                <p className="text-base">
                  This is <strong>bold</strong> text.
                </p>
              </div>
            </div>
          </RightSidebar>
        </Allotment.Pane>
      </Allotment>
    </div>
  ),
};

export const Collapsible: Story = {
  render: () => (
    <div className="h-96 border border-border rounded-md overflow-hidden">
      <Allotment>
        <Allotment.Pane>
          <div className="h-full flex items-center justify-center bg-muted/20">
            <div className="text-center">
              <p className="text-muted-foreground mb-2">Main Content</p>
              <p className="text-sm text-muted-foreground">
                Double-click the divider to collapse/expand the right sidebar
              </p>
            </div>
          </div>
        </Allotment.Pane>
        <Allotment.Pane minSize={200} maxSize={600} preferredSize={300} snap>
          <RightSidebar>
            <div className="p-4">
              <h3 className="font-semibold mb-2">Collapsible Right Sidebar</h3>
              <p className="text-sm text-muted-foreground">
                Double-click the divider to collapse/expand
              </p>
            </div>
          </RightSidebar>
        </Allotment.Pane>
      </Allotment>
    </div>
  ),
};
