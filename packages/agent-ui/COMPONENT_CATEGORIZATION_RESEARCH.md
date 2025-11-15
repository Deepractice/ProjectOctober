# Component Categorization Research

Research on how major UI libraries categorize components, with focus on content rendering components.

**Research Date:** 2025-11-14

---

## Executive Summary

After analyzing 5 major design systems (Ant Design, Material-UI, Chakra UI, shadcn/ui, and Radix UI), the industry standard is to use a **"Data Display"** category for components that render structured content like Markdown, JSON, Code, and Diffs. The term **"Content"** is rarely used as a top-level category name in production design systems.

### Key Findings

1. **"Data Display" is the standard category** - Used by Ant Design, Material-UI, and Chakra UI
2. **No major library uses "Content" as a category** - It's too generic and ambiguous
3. **Typography lives separately** - Usually in its own category or under "General"
4. **Code/Markdown components are rare** - Most libraries don't provide them out-of-the-box

---

## 1. Ant Design Component Categories

Ant Design is one of the most comprehensive enterprise design systems. Their categorization is widely considered best practice.

### Complete Category Structure

**General** (4 components)

- Button, FloatButton, Icon, Typography

**Layout** (6 components)

- Divider, Flex, Grid, Layout, Space, Splitter

**Navigation** (7 components)

- Anchor, Breadcrumb, Dropdown, Menu, Pagination, Steps, Tabs

**Data Entry** (18 components)

- AutoComplete, Cascader, Checkbox, ColorPicker, DatePicker, Form, Input, InputNumber, Mentions, Radio, Rate, Select, Slider, Switch, TimePicker, Transfer, TreeSelect, Upload

**Data Display** (19 components) ⭐

- Avatar, Badge, Calendar, Card, Carousel, Collapse, Descriptions, Empty, Image, List, Popover, QRCode, Segmented, Statistic, Table, Tag, Timeline, Tooltip, Tour, Tree

**Feedback** (12 components)

- Alert, Drawer, Message, Modal, Notification, Popconfirm, Progress, Result, Skeleton, Spin, Watermark

**Other** (3 components)

- Affix, App, ConfigProvider

### How Ant Design Handles Content Components

- **Typography**: Included in "General" category with `code` prop for inline code display
- **Markdown**: Not provided (users integrate `react-markdown` with `.ant-typography` class)
- **Code Blocks**: Not provided natively
- **JSON Viewer**: Not provided
- **Diff Viewer**: Not provided

**Observation:** Ant Design focuses on structured data display (tables, lists, descriptions) rather than rich text rendering.

---

## 2. Material-UI (MUI) Component Categories

Material-UI organizes components functionally with clear separation between inputs and outputs.

### Complete Category Structure

**Inputs** (Components for user input)

- Autocomplete, Button, Button Group, Checkbox, Floating Action Button, Radio Group, Rating, Select, Slider, Switch, Text Field, Transfer List, Toggle Button

**Data Display** (Components for presenting information) ⭐

- Avatar, Badge, Chip, Divider, Icons, List, Table, Tooltip, Typography

**Feedback** (System response indicators)

- Alert, Backdrop, Dialog, Progress, Skeleton, Snackbar

**Surfaces** (Container components)

- Accordion, App Bar, Card, Paper

**Navigation** (Moving through the app)

- Bottom Navigation, Breadcrumbs, Drawer, Link, Menu, Pagination, Speed Dial, Stepper, Tabs

**Layout** (Organizing content)

- Box, Container, Grid, Grid (v2), Stack, Image List, Hidden

**Utils** (Utility components)

- Click-Away Listener, CSS Baseline, Modal, No SSR, Popover, Popper, Portal, Textarea Autosize, Transitions, useMediaQuery

**MUI X** (Advanced components)

- Data Grid, Date and Time Pickers, Charts, Tree View

**Lab** (Experimental)

- Masonry, Timeline

### How MUI Handles Content Components

- **Typography**: Dedicated component in "Data Display" with variants (h1-h6, body1-2, caption, etc.)
- **Code Display**: Not provided (Typography has `component="code"` option)
- **Markdown**: Not provided
- **JSON Viewer**: Not provided
- **Diff Viewer**: Not provided

**Observation:** MUI has a clear "Data Display" category for presenting information to users, which is the natural home for content rendering components.

---

## 3. Chakra UI Component Categories

Chakra UI uses semantic, developer-friendly category names with excellent component organization.

### Complete Category Structure

**Layout** (16 components)

- Aspect Ratio, Bleed, Box, Center (Absolute), Center, Container, Flex, Float, Grid, Group, Scroll Area, Separator, SimpleGrid, Stack, Wrap

**Typography** (13 components)

- Blockquote, Code, Code Block (beta), Em, Heading, Highlight, Kbd, Link, Link Overlay, List, Mark, Prose, Text

**Buttons** (4 components)

- Button, Close Button, Icon Button, Download Trigger

**Forms** (20 components)

- Checkbox, Checkbox Card, Color Picker, Color Swatch, Editable, Field, Fieldset, File Upload, Input, Number Input, Password Input, Pin Input, Radio Card, Radio, Rating, Segmented Control, Select (Native), Switch, Slider, Textarea, Tags Input

**Collections** (4 components)

- Combobox, Listbox, Select, Tree View (beta)

**Overlays** (7 components)

- Action Bar, Dialog, Drawer, Hover Card, Menu, Overlay Manager, Popover, Toggle Tip, Tooltip

**Disclosure** (7 components)

- Accordion, Breadcrumb, Carousel, Collapsible, Pagination, Steps, Tabs

**Feedback** (9 components)

- Alert, Empty State, Progress Circle, Progress, Skeleton, Spinner, Status, Toast

**Data Display** (10 components) ⭐

- Avatar, Badge, Card, Clipboard, Image, Data List, Icon, QR Code, Stat, Table, Tag, Timeline

### How Chakra UI Handles Content Components

- **Typography**: Dedicated category with Code and Code Block components! ⭐
- **Code Display**: `Code` (inline) and `Code Block` components in Typography
- **Markdown**: Not provided (community packages available)
- **JSON Viewer**: Not provided
- **Diff Viewer**: Not provided
- **Prose**: Component for rendering rich text content

**Observation:** Chakra UI is the most progressive in handling code display, providing dedicated components in the Typography category. They separate "Typography" (text rendering) from "Data Display" (structured data).

---

## 4. shadcn/ui Component Organization

shadcn/ui is not a traditional component library but a collection of copy-paste components. Their organization is simpler.

### Component Categories (Informal)

**Basic UI Components**

- Accordion, Alert, Alert Dialog, Avatar, Badge, Button, Card, Checkbox, Collapsible, Dialog, Drawer, Input, Label, Progress, Radio Group, Select, Separator, Skeleton, Slider, Switch, Tabs, Toggle

**Navigation & Interaction**

- Breadcrumb, Command, Context Menu, Dropdown Menu, Menubar, Navigation Menu, Pagination

**Data Display** ⭐

- Aspect Ratio, Calendar, Carousel, Chart, Combobox, Data Table, Date Picker, Scroll Area, Table

**Feedback**

- Toast, Spinner, Sonner

**Layout**

- Resizable, Sidebar

**Typography & Text**

- Typography (examples, not a component)
- Kbd (keyboard key display)

### How shadcn/ui Handles Content Components

- **Typography**: Documentation/examples only, not installable components
- **Code Display**: Typography examples show inline code with `bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm`
- **Markdown**: Community packages like `shadcn-markdown` integrate react-markdown with Tailwind Typography
- **JSON Viewer**: Not provided
- **Diff Viewer**: Not provided

**Observation:** shadcn/ui focuses on UI primitives and leaves rich content rendering to third-party integrations.

---

## 5. Radix UI Component Organization

Radix UI provides unstyled, accessible primitives. They organize by UI pattern rather than visual category.

### Component Organization (Pattern-Based)

**Interactive Components**

- Accordion, Checkbox, Collapsible, Dialog, Dropdown Menu, Radio Group, Select, Switch

**Navigation**

- Context Menu, Menubar, Navigation Menu, Tabs

**Informational/Display**

- Avatar, Hover Card, Progress, Tooltip

**Form Elements**

- Checkbox, Radio Group, Select, Switch

**Utilities**

- Accessible Icon, Direction Provider, Portal, Slot, Visually Hidden

### How Radix UI Handles Content Components

- **Typography**: Not provided (primitives only)
- **Code Display**: Not provided
- **Markdown**: Not provided
- **JSON Viewer**: Not provided
- **Diff Viewer**: Not provided

**Observation:** Radix focuses on behavior and accessibility, not content rendering.

---

## Industry Standard Categorization Patterns

### Common Categories Across All Libraries

| Category         | Ant Design         | Material-UI     | Chakra UI        | shadcn/ui     |
| ---------------- | ------------------ | --------------- | ---------------- | ------------- |
| **Data Display** | ✅ (19)            | ✅ (9)          | ✅ (10)          | ✅ (8)        |
| **Layout**       | ✅ (6)             | ✅ (7)          | ✅ (16)          | ✅ (2)        |
| **Navigation**   | ✅ (7)             | ✅ (9)          | Via Disclosure   | ✅ (7)        |
| **Inputs/Forms** | ✅ Data Entry (18) | ✅ Inputs (13)  | ✅ Forms (20)    | ✅ Basic UI   |
| **Feedback**     | ✅ (12)            | ✅ (6)          | ✅ (9)           | ✅ (3)        |
| **Typography**   | In General         | In Data Display | ✅ Separate (13) | Examples only |

### Where Do Content Rendering Components Belong?

Based on the research, here's how major libraries would categorize our components:

| Component        | Ant Design   | Material-UI  | Chakra UI    | shadcn/ui           |
| ---------------- | ------------ | ------------ | ------------ | ------------------- |
| **MarkdownText** | Data Display | Data Display | Typography   | Typography examples |
| **JSONRenderer** | Data Display | Data Display | Data Display | Data Display        |
| **DiffViewer**   | Data Display | Data Display | Data Display | Data Display        |
| **Code Block**   | Not provided | Not provided | Typography   | Typography examples |

---

## Recommendations for agent-ui

### Current Structure Analysis

Our current categorization:

```typescript
// UI Components (Atoms) - 18 components
// Layout Components - 7 components
// Content Components (Molecules) - 3 components ⚠️
//   - JSONRenderer, DiffViewer, MarkdownText
// Message Components (Molecules) - 3 components
// Chat Components (Molecules) - 2 components
// Session Components (Composite) - 4 components
```

### Problem with "Content"

1. **Not industry standard** - No major library uses "Content" as a category
2. **Too generic** - Everything is "content" (buttons are content, images are content)
3. **Ambiguous** - Doesn't convey what these components do
4. **Inconsistent with peers** - Goes against established patterns

### Recommended Changes

#### Option 1: Follow Ant Design/MUI Pattern (Recommended) ⭐

Rename "Content Components" to **"Data Display"** to match industry leaders:

```typescript
// Data Display Components
export { JSONRenderer } from "./components/data-display/JSONRenderer";
export { DiffViewer } from "./components/data-display/DiffViewer";
export { MarkdownText } from "./components/data-display/MarkdownText";
```

**Pros:**

- Matches Ant Design, Material-UI conventions
- Clear semantic meaning: "displaying data to users"
- Scalable (can add Table, List, Chart components later)
- Familiar to developers from other ecosystems

**Cons:**

- Requires file/folder rename

#### Option 2: Follow Chakra UI Pattern

Split into **"Typography"** and **"Data Display"**:

```typescript
// Typography Components
export { MarkdownText } from "./components/typography/MarkdownText";
export { CodeBlock } from "./components/typography/CodeBlock";

// Data Display Components
export { JSONRenderer } from "./components/data-display/JSONRenderer";
export { DiffViewer } from "./components/data-display/DiffViewer";
```

**Pros:**

- More granular categorization
- Separates text rendering from data visualization
- Follows Chakra UI's progressive approach

**Cons:**

- More complex file structure
- MarkdownText contains both text and data aspects

#### Option 3: Keep Current Structure

Keep "Content Components" as a unique category:

**Pros:**

- No migration needed
- Simple and straightforward

**Cons:**

- Goes against industry standards
- May confuse developers familiar with other libraries
- Doesn't scale well (where do Tables, Charts go?)

---

## Final Recommendation

**Use "Data Display" category** following the Ant Design/Material-UI pattern.

### Reasoning:

1. **Industry Standard**: 3 out of 4 major libraries (Ant Design, MUI, Chakra UI) use "Data Display"
2. **Semantic Clarity**: These components display data (JSON data, diff data, markdown data) to users
3. **Future-Proof**: Easy to add Table, Chart, List components later
4. **Developer Familiarity**: Most React developers have used Ant Design or MUI
5. **Documentation**: Can link to Ant Design/MUI docs for comparison

### Migration Path:

```bash
# 1. Rename folder
mv src/components/content src/components/data-display

# 2. Update imports in index.ts
# 3. Update story files
# 4. Run tests to verify
```

### Expected File Structure:

```
packages/agent-ui/src/components/
├── ui/                    # Basic UI primitives (atoms)
├── layout/                # Layout components
├── data-display/          # Data presentation components ⭐
│   ├── JSONRenderer.tsx
│   ├── DiffViewer.tsx
│   └── MarkdownText.tsx
├── message/               # Message components
├── chat/                  # Chat components
└── session/               # Session components
```

---

## References

- [Ant Design Components](https://ant.design/components/overview/)
- [Material-UI Components](https://mui.com/material-ui/all-components/)
- [Chakra UI Components](https://chakra-ui.com/docs/components)
- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)

---

## Appendix: Component Count by Category

| Library     | Total Components | Data Display | Typography      | Inputs/Forms | Layout   |
| ----------- | ---------------- | ------------ | --------------- | ------------ | -------- |
| Ant Design  | 69               | 19 (28%)     | In General      | 18 (26%)     | 6 (9%)   |
| Material-UI | 50+              | 9 (18%)      | In Data Display | 13 (26%)     | 7 (14%)  |
| Chakra UI   | 90+              | 10 (11%)     | 13 (14%)        | 20 (22%)     | 16 (18%) |
| shadcn/ui   | 50+              | 8 (16%)      | Examples only   | ~15 (30%)    | 2 (4%)   |

**Observation:** Data Display is consistently 10-30% of component libraries, making it a substantial and well-defined category.
