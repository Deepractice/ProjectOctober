# Elements (Atomic UI Components)

Fundamental UI building blocks for the Agent UI library. These are **primitive components** that have no business logic and can be used anywhere.

## Design Principle

> **shadcn/ui First**: Use shadcn/ui components whenever possible. Only implement custom components when shadcn/ui doesn't provide what we need.

### Why shadcn/ui?

1. ✅ **Copy-paste approach** - Code lives in your project, fully customizable
2. ✅ **Tailwind + Radix UI** - Matches our tech stack perfectly
3. ✅ **Accessible** - Built on Radix UI primitives
4. ✅ **Maintained** - Active community, regular updates
5. ✅ **No dependencies bloat** - Not an npm package, just code

---

## Component Strategy

### Three Categories

#### 1️⃣ **From shadcn/ui** (Preferred)

Components directly copied from [shadcn/ui](https://ui.shadcn.com):

**Available in shadcn/ui**:

- `Button` - [shadcn/ui/button](https://ui.shadcn.com/docs/components/button)
- `Input` - [shadcn/ui/input](https://ui.shadcn.com/docs/components/input)
- `Badge` - [shadcn/ui/badge](https://ui.shadcn.com/docs/components/badge)
- `Dialog` - [shadcn/ui/dialog](https://ui.shadcn.com/docs/components/dialog)
- `Dropdown Menu` - [shadcn/ui/dropdown-menu](https://ui.shadcn.com/docs/components/dropdown-menu)
- `Tooltip` - [shadcn/ui/tooltip](https://ui.shadcn.com/docs/components/tooltip)
- `Tabs` - [shadcn/ui/tabs](https://ui.shadcn.com/docs/components/tabs)
- `Card` - [shadcn/ui/card](https://ui.shadcn.com/docs/components/card)
- `Avatar` - [shadcn/ui/avatar](https://ui.shadcn.com/docs/components/avatar)
- `Separator` - [shadcn/ui/separator](https://ui.shadcn.com/docs/components/separator)
- `ScrollArea` - [shadcn/ui/scroll-area](https://ui.shadcn.com/docs/components/scroll-area)
- `Popover` - [shadcn/ui/popover](https://ui.shadcn.com/docs/components/popover)
- ... [and many more](https://ui.shadcn.com/docs/components)

**How to add**:

```bash
# Just copy from shadcn/ui documentation
# Place in src/components/elements/
# Adjust imports if needed
```

#### 2️⃣ **Agent-Specific Elements** (Custom)

Components unique to Agent applications that shadcn/ui doesn't provide:

**Examples**:

- `AgentLogo` - Brand logo component
- `MessageAvatar` - AI/User avatar with status indicators
- `TokenUsage` - Token consumption display
- `StreamingIndicator` - Real-time streaming animation
- `ThinkingDots` - AI thinking animation

**Criteria for custom elements**:

- [ ] Not available in shadcn/ui
- [ ] Truly atomic (no business logic)
- [ ] Reusable across Agent applications
- [ ] No domain knowledge (sessions, messages, etc.)

#### 3️⃣ **Enhanced Elements** (Extended shadcn/ui)

shadcn/ui components with Agent-specific enhancements:

**Example**:

```tsx
// Based on shadcn/ui Input, but with Agent-specific features
export function SearchInput({ onSearch, ...props }) {
  // shadcn/ui Input as base
  // + Agent-specific search icon
  // + Agent-specific keyboard shortcuts
  return <Input ... />
}
```

---

## Decision Flow

When you need a UI component:

```
Do we need a UI component?
  ↓
  ├─ YES → Is it in shadcn/ui?
  │         ├─ YES → Copy from shadcn/ui ✅
  │         └─ NO → Is it truly atomic?
  │                  ├─ YES → Implement in elements/ ✅
  │                  └─ NO → Wrong directory, use chat/, session/, etc. ❌
  │
  └─ NO → You might need a composite component instead
```

---

## Component Catalog

### Currently Available

#### From shadcn/ui

- `Button` - Action buttons with variants
- `Input` - Text input field
- `Badge` - Status labels
- `ScrollArea` - Scrollable container (Radix UI based)
- `Popover` - Popup container (Radix UI based)

#### Agent-Specific

- `AgentLogo` - Deepractice Agent branding
- `MessageAvatar` - User/AI avatars
- `TokenUsagePie` - Token usage visualization
- `TimeAgo` - Relative time display
- `ImageAttachment` - Image preview with controls

#### Enhanced

- `SearchInput` - Input with search icon and shortcuts
- `ActionBar` - Button group for actions
- `EmptyState` - Empty state placeholder
- `LoadingState` - Loading indicator

---

## Rules & Guidelines

### ✅ DO

**Use shadcn/ui whenever possible**:

```tsx
// Good: Copy from shadcn/ui
import { Button } from "~/components/elements/Button";
```

**Keep elements atomic**:

```tsx
// Good: Just a button
<Button variant="primary">Click me</Button>

// Good: Just an input
<Input placeholder="Type here..." />
```

**Make them composable**:

```tsx
// Good: Elements compose into larger components
<div>
  <Input />
  <Button>Submit</Button>
</div>
```

### ❌ DON'T

**Don't add business logic**:

```tsx
// Bad: Element shouldn't know about sessions
function Button({ sessionId, onSessionClick }) {
  const session = fetchSession(sessionId); // ❌
  return <button onClick={() => onSessionClick(session)} />;
}
```

**Don't couple to domain**:

```tsx
// Bad: Too specific to Agent domain
function SessionButton({ session }) { ... } // ❌

// Good: Generic, reusable
function Button({ children, onClick }) { ... } // ✅
```

**Don't implement what shadcn/ui has**:

```tsx
// Bad: Reinventing the wheel
function MyDialog() { ... } // ❌

// Good: Use shadcn/ui
import { Dialog } from "~/components/elements/Dialog" // ✅
```

---

## Adding New Components

### From shadcn/ui (Preferred)

**Step 1**: Check [shadcn/ui components](https://ui.shadcn.com/docs/components)

**Step 2**: Copy the code into `elements/`

```bash
# Example: Adding Dialog
# 1. Go to https://ui.shadcn.com/docs/components/dialog
# 2. Copy the code
# 3. Create src/components/elements/Dialog.tsx
# 4. Paste and adjust imports
```

**Step 3**: Adjust imports if needed

```tsx
// Change this:
import { cn } from "@/lib/utils";

// To this:
import { cn } from "~/lib/utils";
```

**Step 4**: Export in `elements/index.ts`

### Custom Elements (Only if needed)

**Before implementing, ask**:

1. ❓ Does shadcn/ui have this? → Use shadcn/ui
2. ❓ Is this truly atomic? → If not, it belongs elsewhere
3. ❓ Is it Agent-specific or generic? → Be honest

**If you must implement**:

```tsx
// src/components/elements/StreamingIndicator.tsx
import * as React from "react";
import { cn } from "~/lib/utils";

interface StreamingIndicatorProps {
  className?: string;
}

export function StreamingIndicator({ className }: StreamingIndicatorProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      <span className="animate-pulse">●</span>
      <span className="animate-pulse delay-100">●</span>
      <span className="animate-pulse delay-200">●</span>
    </div>
  );
}
```

**Add Storybook story**:

```tsx
// src/components/elements/StreamingIndicator.stories.tsx
export const Default: Story = {
  render: () => <StreamingIndicator />,
};
```

---

## Comparison: elements/ vs Other Directories

| Directory   | Purpose              | Examples                 | Business Logic? |
| ----------- | -------------------- | ------------------------ | --------------- |
| `elements/` | Atomic UI primitives | Button, Input, Badge     | ❌ NO           |
| `layout/`   | Spatial containers   | Header, Sidebar, Panel   | ❌ NO           |
| `content/`  | Content renderers    | Markdown, JSON, Diff     | ❌ NO           |
| `message/`  | Message types        | UserMessage, AIMessage   | ✅ Minimal      |
| `session/`  | Session management   | SessionList, SessionItem | ✅ YES          |
| `chat/`     | Chat interface       | ChatInput, MessageList   | ✅ YES          |

**Rule of thumb**:

- `elements/` = Generic UI that works anywhere
- Other directories = Agent-specific business components

---

## Migration from `ui/`

The old `ui/` directory is being migrated to `elements/`:

### Migration Status

| Component     | Status     | Action                                  |
| ------------- | ---------- | --------------------------------------- |
| Button        | ✅ Keep    | Already compatible with shadcn/ui style |
| Input         | ✅ Keep    | Already compatible with shadcn/ui style |
| Badge         | ✅ Keep    | Already compatible with shadcn/ui style |
| AgentLogo     | ✅ Move    | Agent-specific, belongs in elements/    |
| MessageAvatar | ✅ Move    | Agent-specific, belongs in elements/    |
| TokenUsagePie | ✅ Move    | Agent-specific, belongs in elements/    |
| TimeAgo       | ✅ Move    | Generic utility, belongs in elements/   |
| SearchInput   | ✅ Move    | Enhanced Input, belongs in elements/    |
| ActionBar     | 🤔 Review  | Might belong in layout/ or elements/    |
| AppHeader     | ⚠️ Move    | Belongs in layout/, not elements/       |
| PageHeader    | ⚠️ Move    | Belongs in layout/, not elements/       |
| TabNavigation | ⚠️ Replace | Use shadcn/ui Tabs instead              |
| ListItem      | ⚠️ Review  | Too specific? Might not need it         |

### Gradual Migration Plan

**Phase 1** (Now):

- ✅ Create `elements/` directory
- ✅ Write this README
- ⏸️ Keep `ui/` working (backwards compatibility)

**Phase 2** (Next):

- Copy shadcn/ui components we need
- Move Agent-specific components from `ui/` to `elements/`
- Add deprecation warnings in `ui/`

**Phase 3** (Later):

- Update all imports to use `elements/`
- Remove `ui/` directory
- Update documentation

---

## shadcn/ui Integration

### Installation (Not needed - we copy code)

shadcn/ui is NOT installed as a package. We copy components as needed.

### Dependencies (Already installed)

```json
{
  "dependencies": {
    "class-variance-authority": "^0.7.1", // ✅ For variants
    "clsx": "^2.1.1", // ✅ For class merging
    "tailwind-merge": "^2.5.5" // ✅ For cn() utility
  }
}
```

### Radix UI Primitives (Install as needed)

When copying shadcn/ui components that use Radix UI:

```bash
# Example: Dialog uses @radix-ui/react-dialog
pnpm add @radix-ui/react-dialog

# Example: Dropdown uses @radix-ui/react-dropdown-menu
pnpm add @radix-ui/react-dropdown-menu
```

---

## Best Practices

### 1. Start with shadcn/ui

Always check shadcn/ui first before implementing.

### 2. Keep it atomic

If a component needs multiple elements, it's not an element.

```tsx
// ❌ Not atomic
function LoginForm() {
  return (
    <>
      <Input />
      <Input type="password" />
      <Button>Login</Button>
    </>
  )
}

// ✅ Atomic
function Button() { ... }
function Input() { ... }

// ✅ Composition (belongs in different directory)
function LoginForm() {
  return (
    <>
      <Input />
      <Input type="password" />
      <Button>Login</Button>
    </>
  )
}
```

### 3. No business logic

Elements should be stateless and pure.

### 4. Document the source

If from shadcn/ui, add a comment:

```tsx
/**
 * Button component
 *
 * Based on shadcn/ui Button component
 * @see https://ui.shadcn.com/docs/components/button
 */
export function Button() { ... }
```

---

## Resources

- [shadcn/ui Components](https://ui.shadcn.com/docs/components) - Browse available components
- [Radix UI](https://www.radix-ui.com/) - Underlying primitives
- [CVA Documentation](https://cva.style/docs) - Variant API
- [Design System](../../DESIGN_SYSTEM.md) - Our design tokens

---

## Contributing

When adding new elements:

1. **Check shadcn/ui first** - Don't reinvent
2. **Follow naming** - Use PascalCase
3. **Add TypeScript** - Strict types required
4. **Write stories** - Every element needs stories
5. **Document source** - Comment where code came from
6. **Update this README** - Keep catalog current

Questions? Review the decision flow above or check shadcn/ui documentation first.
