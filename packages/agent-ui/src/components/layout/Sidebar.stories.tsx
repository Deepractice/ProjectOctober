import type { Meta, StoryObj } from "@storybook/react";
import { Sidebar } from "./Sidebar";
import { Allotment } from "allotment";
import "allotment/dist/style.css";

const meta: Meta<typeof Sidebar> = {
  title: "Layout/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  parameters: {
    docs: {
      description: {
        component:
          "A resizable sidebar container. Use with Allotment for drag-to-resize functionality.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  render: () => (
    <div className="h-96 border border-border rounded-md overflow-hidden">
      <Allotment>
        <Allotment.Pane minSize={200} maxSize={600} preferredSize={256}>
          <Sidebar>
            <div className="p-4">
              <h3 className="font-semibold mb-2">Sidebar Content</h3>
              <p className="text-sm text-muted-foreground">
                Drag the divider to resize this sidebar
              </p>
            </div>
          </Sidebar>
        </Allotment.Pane>
        <Allotment.Pane>
          <div className="h-full flex items-center justify-center bg-muted/20">
            <p className="text-muted-foreground">Main Content</p>
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  ),
};

export const RightPosition: Story = {
  render: () => (
    <div className="h-96 border border-border rounded-md overflow-hidden">
      <Allotment>
        <Allotment.Pane>
          <div className="h-full flex items-center justify-center bg-muted/20">
            <p className="text-muted-foreground">Main Content</p>
          </div>
        </Allotment.Pane>
        <Allotment.Pane minSize={200} maxSize={600} preferredSize={256}>
          <Sidebar position="right">
            <div className="p-4">
              <h3 className="font-semibold mb-2">Right Sidebar</h3>
              <p className="text-sm text-muted-foreground">This sidebar is on the right side</p>
            </div>
          </Sidebar>
        </Allotment.Pane>
      </Allotment>
    </div>
  ),
};

export const WithListContent: Story = {
  render: () => (
    <div className="h-96 border border-border rounded-md overflow-hidden">
      <Allotment>
        <Allotment.Pane minSize={200} maxSize={600} preferredSize={300}>
          <Sidebar>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">Files</h3>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-2">
                {Array.from({ length: 20 }, (_, i) => (
                  <div
                    key={i}
                    className="px-3 py-2 rounded-md hover:bg-accent cursor-pointer text-sm"
                  >
                    File {i + 1}.tsx
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-border text-xs text-muted-foreground">
                20 files
              </div>
            </div>
          </Sidebar>
        </Allotment.Pane>
        <Allotment.Pane>
          <div className="h-full flex items-center justify-center bg-muted/20">
            <p className="text-muted-foreground">Editor Area</p>
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  ),
};

export const Collapsible: Story = {
  render: () => (
    <div className="h-96 border border-border rounded-md overflow-hidden">
      <Allotment>
        <Allotment.Pane minSize={200} maxSize={600} preferredSize={256} snap>
          <Sidebar>
            <div className="p-4">
              <h3 className="font-semibold mb-2">Collapsible Sidebar</h3>
              <p className="text-sm text-muted-foreground">
                Double-click the divider to collapse/expand
              </p>
            </div>
          </Sidebar>
        </Allotment.Pane>
        <Allotment.Pane>
          <div className="h-full flex items-center justify-center bg-muted/20">
            <p className="text-muted-foreground">Main Content</p>
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  ),
};
