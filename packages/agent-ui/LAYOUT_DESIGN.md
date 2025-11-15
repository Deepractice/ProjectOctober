# Layout Component Architecture (allotment-based)

## Overview

Layout components provide VSCode-style resizable layouts using the `allotment` library. They are **presentation-only** components with no business logic, following the **Headless Component** pattern.

## Why allotment?

- ✅ **Lightweight** (~50KB) - Much smaller than alternatives
- ✅ **VSCode Experience** - Smooth drag-to-resize, snap behavior
- ✅ **Simple API** - Just `<Allotment>` and `<Allotment.Pane>`
- ✅ **Active Maintenance** - 3.5k+ stars, TypeScript support
- ✅ **No Lock-in** - Standard React component, easy to replace

## Component Hierarchy

```
layout/
└── AppLayout.tsx       - VSCode-style app shell (Activity Bar + Sidebar + Main)

ui/
└── ActivityBar.tsx     - Icon button bar for view switching
```

## Layout Structure

```
┌──┬────────┬──────────────────────────────────────┐
│  │        │                                      │
│A │        │                                      │
│c │ Side   │                                      │
│t │ bar    │       Main Content                   │
│i │        │                                      │
│v │        │                                      │
│i │ (Resi  │                                      │
│t │ zable) │                                      │
│y │        │                                      │
│  │        │                                      │
│B │        │                                      │
│a │        │                                      │
│r │        │                                      │
└──┴────────┴──────────────────────────────────────┘
```

## Components

### 1. ActivityBar (UI Component)

**Purpose**: VSCode-style icon button bar

**Props**:

```typescript
interface ActivityBarItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  badge?: string | number;
}

interface ActivityBarProps {
  items: ActivityBarItem[];
  activeId?: string;
  onItemClick?: (id: string) => void;
  position?: "left" | "right";
}
```

**Features**:

- Icon buttons with hover states
- Active state indicator (border)
- Notification badges
- Tooltip labels
- Left/right positioning

**Example**:

```tsx
<ActivityBar
  items={[
    { id: "chat", icon: <MessageSquare />, label: "Chat" },
    { id: "search", icon: <Search />, label: "Search" },
    { id: "git", icon: <GitBranch />, label: "Git", badge: 3 },
  ]}
  activeId="chat"
  onItemClick={setActiveView}
/>
```

### 2. AppLayout (Layout Component)

**Purpose**: Complete VSCode-style application shell

**Props**:

```typescript
interface AppLayoutProps {
  activityBar?: React.ReactNode; // Activity bar content
  sidebar?: React.ReactNode; // Sidebar content
  children: React.ReactNode; // Main content
  sidebarVisible?: boolean; // Show/hide sidebar
  sidebarWidth?: number; // Initial width (default: 256px)
  sidebarMinWidth?: number; // Min width (default: 200px)
  sidebarMaxWidth?: number; // Max width (default: 600px)
  activityBarWidth?: number; // Width (default: 48px)
}
```

**Features**:

- Powered by allotment for smooth resizing
- Fixed-width activity bar
- Resizable sidebar with min/max constraints
- Snap-to-close sidebar (double-click divider)
- Flexible main content area

**Example**:

```tsx
<AppLayout
  activityBar={
    <ActivityBar items={activityItems} activeId={activeView} onItemClick={setActiveView} />
  }
  sidebar={<SessionSidebar sessions={sessions} selectedId={currentId} onSelect={handleSelect} />}
  sidebarVisible={sidebarOpen}
  sidebarWidth={300}
>
  <ChatInterface />
</AppLayout>
```

## Usage Examples

### Complete Chat Application

```tsx
import { AppLayout, ActivityBar, SessionSidebar, ChatHeader } from "@deepractice-ai/agent-ui";
import { MessageSquare, Search, Settings } from "lucide-react";

function ChatApp() {
  const [activeView, setActiveView] = useState("sessions");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activityItems = [
    { id: "sessions", icon: <MessageSquare />, label: "Sessions" },
    { id: "search", icon: <Search />, label: "Search" },
    { id: "settings", icon: <Settings />, label: "Settings" },
  ];

  return (
    <div className="h-screen">
      <AppLayout
        activityBar={
          <ActivityBar items={activityItems} activeId={activeView} onItemClick={setActiveView} />
        }
        sidebar={
          <SessionSidebar sessions={sessions} selectedId={currentSession} onSelect={handleSelect} />
        }
        sidebarVisible={sidebarOpen}
      >
        <div className="h-full flex flex-col">
          <ChatHeader title="New Session" activeTab="chat" onTabChange={setTab} />
          <div className="flex-1">{/* Chat messages */}</div>
        </div>
      </AppLayout>
    </div>
  );
}
```

### Dynamic Sidebar Content

```tsx
function App() {
  const [activeView, setActiveView] = useState("files");

  const getSidebarContent = () => {
    switch (activeView) {
      case "files":
        return <FileExplorer />;
      case "search":
        return <SearchPanel />;
      case "git":
        return <GitPanel />;
      default:
        return null;
    }
  };

  return (
    <AppLayout
      activityBar={<ActivityBar items={items} activeId={activeView} onItemClick={setActiveView} />}
      sidebar={getSidebarContent()}
    >
      <Editor />
    </AppLayout>
  );
}
```

### Collapsed Sidebar

```tsx
function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AppLayout
      activityBar={
        <ActivityBar items={items} activeId="files" onItemClick={() => setSidebarOpen(true)} />
      }
      sidebar={<FileExplorer />}
      sidebarVisible={sidebarOpen}
    >
      <MainContent>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>Toggle Sidebar</button>
      </MainContent>
    </AppLayout>
  );
}
```

## allotment Features Used

### Resizable Panes

```tsx
<Allotment>
  <Allotment.Pane minSize={200} maxSize={600} preferredSize={300}>
    <Sidebar />
  </Allotment.Pane>
  <Allotment.Pane>
    <Main />
  </Allotment.Pane>
</Allotment>
```

### Snap Behavior

Double-click the divider to collapse/expand:

```tsx
<Allotment.Pane snap>
  <Sidebar />
</Allotment.Pane>
```

### Vertical Layout

```tsx
<Allotment vertical>
  <Allotment.Pane>
    <Editor />
  </Allotment.Pane>
  <Allotment.Pane>
    <Terminal />
  </Allotment.Pane>
</Allotment>
```

## Styling

### Required CSS Import

```tsx
import "allotment/dist/style.css";
```

### Customize Divider

```css
.allotment-sash {
  background: var(--border-color);
}

.allotment-sash:hover {
  background: var(--primary-color);
}
```

### CSS Variables

```css
:root {
  --separator-border: 1px solid #e5e7eb;
  --focus-border: 2px solid #3b82f6;
  --sash-size: 4px;
}
```

## Responsive Behavior

For mobile layouts, consider hiding the sidebar and showing it as an overlay:

```tsx
const isMobile = useMediaQuery("(max-width: 768px)");

<AppLayout
  activityBar={!isMobile ? <ActivityBar {...} /> : undefined}
  sidebar={<Sidebar />}
  sidebarVisible={!isMobile || sidebarOpen}
/>
```

## Performance

- ✅ allotment uses CSS transforms for smooth resizing
- ✅ No re-renders during drag
- ✅ Optimized for 60fps
- ✅ Works well with thousands of elements

## Comparison with Alternatives

| Feature        | allotment | react-mosaic | @fluentui     |
| -------------- | --------- | ------------ | ------------- |
| Size           | 50KB ✅   | 150KB        | 2.5MB ❌      |
| API Simplicity | ✅✅✅    | ⚠️           | ❌            |
| VSCode Feel    | ✅✅✅    | ⚠️           | ❌            |
| Maintenance    | Active ✅ | Active       | Deprecated ❌ |
| TypeScript     | ✅✅✅    | ✅✅         | ✅✅          |

## Future Enhancements

Possible additions:

- Panel (bottom terminal area)
- Tab groups (split editors)
- Drag-and-drop panel reordering
- Save/restore layout state
- Accessibility improvements

## Resources

- **allotment GitHub**: https://github.com/johnwalley/allotment
- **allotment Storybook**: https://allotment-storybook.netlify.app/
- **allotment Docs**: https://allotment.mulberryhousesoftware.com/
