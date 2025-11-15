# @deepractice-ai/agent-ui

React UI components for building AI agent interfaces.

## Design Philosophy

**Single Responsibility Principle (SRP)** - Every component does ONE thing well.

### Core Principles

1. **Atomic Design** - Build from atoms → molecules → organisms
2. **Pure Components** - No side effects, predictable behavior
3. **Composability** - Small components combine into complex UIs
4. **Testability** - Each component can be tested in isolation
5. **Zero Business Logic** - Components only handle presentation

### Anti-Patterns to Avoid

❌ **Multi-Purpose Components**

```tsx
// BAD: One component doing too much
<MessageRenderer
  message={...}
  handleMarkdown
  handleCodeHighlight
  handleToolDisplay
  handleDiff
/>
```

✅ **Single Responsibility Components**

```tsx
// GOOD: Each component has one job
<MessageRouter message={message}>
  <UserMessage content={...} />
  <AssistantMessage>
    <MarkdownText>{content}</MarkdownText>
    <CodeBlock>{code}</CodeBlock>
  </AssistantMessage>
</MessageRouter>
```

## Features

- ✅ **Lightweight**: No heavy dependencies (mitt instead of RxJS)
- ✅ **Type-safe**: Full TypeScript support with strict types
- ✅ **Customizable**: Built with Tailwind CSS and CVA
- ✅ **Accessible**: Based on Radix UI primitives
- ✅ **Tree-shakeable**: Import only what you need
- ✅ **Testable**: Every component has unit tests

## Installation

```bash
pnpm add @deepractice-ai/agent-ui
```

## Usage

```tsx
import { Button, Input, eventBus } from "@deepractice-ai/agent-ui";
import "@deepractice-ai/agent-ui/styles.css";

function App() {
  const handleClick = () => {
    eventBus.emit("notification:show", {
      message: "Hello from Agent UI!",
      type: "success",
    });
  };

  return (
    <div>
      <Input placeholder="Type something..." />
      <Button onClick={handleClick}>Click me</Button>
    </div>
  );
}
```

## Component Architecture

### Component Layers

This package provides three layers of components:

#### 1. **UI Components (Atoms)** - Stateless, Reusable Primitives

Pure presentation components with no business logic:

- `Button`, `Input`, `Badge`, `SearchInput`
- `EmptyState`, `LoadingState`, `TimeAgo`
- `ListItem`, `AppHeader`, `ActionBar`

#### 2. **Content Components (Molecules)** - Specialized Renderers

Components for specific content types:

- `MarkdownText` - Markdown rendering
- `JSONRenderer` - JSON formatting
- `DiffViewer` - Code diff display

#### 3. **Composite Components (Organisms)** - Headless Components

**Stateless** components that combine UI atoms for specific use cases. They:

- ✅ Accept data via props
- ✅ Emit events via callbacks
- ✅ Manage minimal internal state (UI state only)
- ✅ Have **zero business logic**
- ✅ Are **fully reusable** across projects

**Example: Session Management**

```tsx
// SessionSidebar - Composite component
<SessionSidebar
  sessions={data} // 👈 Data from outside
  selectedId={current} // 👈 State from outside
  isLoading={loading} // 👈 State from outside
  onSelect={handleSelect} // 👈 Events emitted
  onDelete={handleDelete} // 👈 Events emitted
  onCreate={handleCreate} // 👈 Events emitted
/>;

// Business component (your app)
function YourSidebar() {
  const sessions = useSessionStore((s) => s.sessions); // Business state
  const selectSession = useSessionStore((s) => s.select); // Business logic

  return <SessionSidebar sessions={sessions} onSelect={(session) => selectSession(session.id)} />;
}
```

**Available Composite Components:**

- `SessionSidebar` - Complete session management UI
- `SessionList` - Session list with empty/loading states
- `SessionSearchBar` - Search + action buttons
- `SessionItem` - Single session display

### Headless Component Pattern

**Key Principle:** Composite components are **presentation containers** that:

1. **No Business Logic** - Don't call APIs, don't manage app state
2. **Event-Driven** - Emit events, don't execute side effects
3. **Stateless (mostly)** - Only manage UI state (e.g., search query, delete loading)
4. **Composable** - Built from smaller UI components

**Comparison:**

```tsx
// ❌ BAD: Component with business logic (not reusable)
function SessionManager() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    fetch("/api/sessions").then(setSessions); // ❌ API call
  }, []);

  return <SessionList sessions={sessions} />;
}

// ✅ GOOD: Headless composite (reusable)
function SessionList({ sessions, onSelect, onDelete }) {
  // Just renders, emits events
  return sessions.map((s) => (
    <SessionItem
      session={s}
      onClick={() => onSelect(s)} // ✅ Emits event
      onDelete={() => onDelete(s.id)} // ✅ Emits event
    />
  ));
}

// ✅ Business logic in your app
function YourApp() {
  const sessions = useSessionStore((s) => s.sessions); // Your state
  const select = useSessionStore((s) => s.select); // Your logic

  return (
    <SessionList
      sessions={sessions}
      onSelect={select} // You handle business logic
    />
  );
}
```

### Utilities

- `cn()` - Tailwind class merger
- `eventBus` - Type-safe event system
- `formatTimeAgo()` - Relative time formatting

## Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Build library
pnpm build

# Type check
pnpm typecheck
```

## Architecture

This package follows **Atomic Design** with strict separation of concerns:

```
src/
├── components/
│   ├── ui/            # Atoms - Single-purpose primitives
│   │   ├── Button.tsx           (ONE job: clickable element)
│   │   ├── Input.tsx            (ONE job: text input)
│   │   ├── Badge.tsx            (ONE job: status label)
│   │   └── CodeBlock.tsx        (ONE job: code display)
│   │
│   ├── content/       # Molecules - Content renderers
│   │   ├── MarkdownText.tsx     (ONE job: render markdown)
│   │   ├── JsonViewer.tsx       (ONE job: format JSON)
│   │   └── DiffView.tsx         (ONE job: show code diff)
│   │
│   ├── message/       # Molecules - Message types
│   │   ├── MessageBubble.tsx    (ONE job: message container)
│   │   ├── UserMessage.tsx      (ONE job: user message)
│   │   └── AssistantMessage.tsx (ONE job: assistant message)
│   │
│   └── chat/          # Organisms - Composed interfaces
│       ├── MessageList.tsx      (ONE job: list messages)
│       ├── InputArea.tsx        (ONE job: message input)
│       └── ChatContainer.tsx    (ONE job: compose chat UI)
│
├── hooks/         # Custom React hooks
├── lib/           # Utilities (EventBus, utils)
└── types/         # TypeScript types
```

### Component Rules

**Each component must:**

- ✅ Have ONE clear responsibility
- ✅ Be testable in isolation
- ✅ Accept props, return JSX (no side effects)
- ✅ Use TypeScript with strict types
- ✅ Follow naming convention: `PascalCase.tsx`

**Components must NOT:**

- ❌ Make API calls
- ❌ Access global state directly
- ❌ Handle multiple concerns
- ❌ Mix presentation and logic

## Development Workflow

### Step 1: Design Component

**Before writing code, ask these questions:**

1. **What is the ONE thing this component does?**
   - ✅ "Displays a clickable button" → Good
   - ❌ "Handles form submission and validation" → Too much

2. **Can I describe it in 5 words or less?**
   - ✅ "Code block with syntax highlighting"
   - ❌ "Message renderer with markdown, code, JSON, and tool displays"

3. **Can it be tested independently?**
   - ✅ Test Button without Input
   - ❌ Can't test MessageRenderer without ToolDisplay

4. **Is it at the right abstraction level?**
   ```
   Atoms:    Button, Input, Badge
   Molecules: MessageBubble, CodeBlock, UserMessage
   Organisms: MessageList, ChatContainer
   ```

### Step 2: Implement Component

**File structure:**

```tsx
// src/components/ui/Button.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "~/lib/utils"

// 1. Define variants with CVA
const buttonVariants = cva(
  "base-classes",
  {
    variants: { ... },
    defaultVariants: { ... }
  }
)

// 2. Define Props interface
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

// 3. Implement component
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

// 4. Export
export { Button, buttonVariants }
```

**Component checklist:**

- ✅ TypeScript with strict types
- ✅ Props extend native HTML attributes
- ✅ Use `React.forwardRef` for ref forwarding
- ✅ Set `displayName` for debugging
- ✅ Export both component and variants

### Step 3: Write Storybook Story

**Create `ComponentName.stories.tsx`:**

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

// 1. Define meta with controls
const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"], // Auto-generate docs
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "ghost"],
    },
    disabled: { control: "boolean" },
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

// 2. Create stories for each variant
export const Default: Story = {
  args: {
    children: "Button",
    variant: "default",
  },
};

export const Outline: Story = {
  args: {
    children: "Outline",
    variant: "outline",
  },
};

// 3. Create interactive showcase
export const AllVariants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Button variant="default">Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
};
```

### Step 4: Test in Storybook

```bash
pnpm storybook
```

**Test checklist:**

- ✅ All variants display correctly
- ✅ Props controls work in sidebar
- ✅ Accessibility checks pass (A11y tab)
- ✅ No console errors
- ✅ Responsive at different sizes

### Step 5: Write Unit Tests (Optional but Recommended)

```tsx
// Button.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

test("renders and handles click", async () => {
  const handleClick = vi.fn();
  render(<Button onClick={handleClick}>Click me</Button>);

  await userEvent.click(screen.getByRole("button"));
  expect(handleClick).toHaveBeenCalled();
});
```

### Step 6: Export in index.ts

```tsx
// src/index.ts
export { Button, buttonVariants } from "./components/ui/Button";
```

### Example: Creating a New Component

**Bad approach:**

```tsx
// ❌ MessagePanel.tsx - doing too much
function MessagePanel({ messages, onSend, onFileUpload }) {
  // Rendering messages
  // Handling input
  // File upload
  // Markdown parsing
  // 300+ lines of code
}
```

**Good approach:**

```tsx
// ✅ Step 1: Break down into single-responsibility components

// Atoms
<Input placeholder="Type..." />
<Button onClick={onSend}>Send</Button>

// Molecules
<MessageBubble>
  <MarkdownText>{content}</MarkdownText>
</MessageBubble>

<InputArea>
  <Input />
  <FileUploadButton />
  <SendButton />
</InputArea>

// Organism
<ChatContainer>
  <MessageList messages={messages} />
  <InputArea onSend={onSend} />
</ChatContainer>
```

## License

MIT
