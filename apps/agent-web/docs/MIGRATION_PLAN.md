# Agent UI Migration Plan

## Current Status (Phase 1 Complete)

### ✅ Already Migrated Components

**Core Chat Components:**

- `ChatInterface.tsx` - Main chat container
- `MessagesArea/` - Message list with pagination
- `MessageRenderer/` - Message rendering with sub-components
- `InputArea/` - User input with sub-components
- `Sidebar/` - Session management with sub-components

**Utility Components:**

- `AgentLogo.tsx` - Branding logo
- `AgentStatus.tsx` - Thinking/processing indicator (WITH countdown timer)
- `AgentStatusBar.tsx` - Status bar component
- `TodoList.tsx` - Task list visualization
- `TokenUsagePie.tsx` - Token usage display
- `CommandMenu.tsx` - Slash command autocomplete
- `MicButton.tsx` - Voice input
- `ImageAttachment.tsx` - Image preview
- `DiffViewer.tsx` - Diff visualization
- `CodeEditor.tsx` - Code editing (missing CodeMirror deps)

**UI Components:**

- `ui/` - shadcn/ui components (badge, button, input, scroll-area)
- `Layout.tsx` - Two-column layout

## Missing Components Analysis

### 🔴 Critical - Missing Top Navigation (HeaderNav)

**From MainContent.tsx Analysis:**
The header section (lines 226-391) contains:

1. **Mobile Menu Button** (lines 230-248)
   - Hamburger menu for mobile/PWA
   - Touch-optimized with `touch-manipulation`

2. **Session Title Display** (lines 249-286)
   - AgentLogo icon
   - Session title/summary
   - Project name
   - Session ID

3. **Tab Navigation** (lines 289-389)
   - Chat tab (with chat icon)
   - Shell tab (with terminal icon)
   - Files tab (with folder icon)
   - ~~Preview tab (commented out)~~

**Current Issue:**

- agent-web's App.tsx只有简单的Layout + Sidebar + ChatInterface
- 完全没有顶部导航栏
- 没有tab切换功能

### 🟡 Important - Missing Features

#### 1. Multi-Tab System

**Location:** MainContent.tsx lines 393-464

- Chat view
- Shell view (StandaloneShell)
- Files view (FileTree)
- Preview view (commented out)

**Current Status:** Only chat view exists

#### 2. Code Editor Right Sidebar

**Location:** MainContent.tsx lines 466-508

- Resizable right sidebar
- Desktop: split view
- Mobile: modal view
- Resize handle with drag functionality

**Current Status:** CodeEditor exists but not integrated

#### 3. Shell Integration

**Components:**

- `Shell.tsx` - Interactive terminal with xterm.js
- `StandaloneShell.tsx` - Standalone shell wrapper

**Current Status:** Not migrated

#### 4. File Tree

**Component:** `FileTree.tsx`
**Current Status:** Not migrated

### 🟢 Optional - Nice to Have

#### 1. Settings Components

- `Settings.tsx` - Main settings panel
- `ApiKeysSettings.tsx` - API key management
- `CredentialsSettings.tsx` - Credentials management
- `QuickSettingsPanel.tsx` - Quick settings

**Current Status:** Not migrated, using UIStore for simple preferences

#### 2. Mobile/PWA Support

- `MobileNav.tsx` - Mobile navigation
- PWA header safe area handling
- Touch optimization

**Current Status:** Partially supported in Sidebar

#### 3. Other Components

- `ErrorBoundary.tsx` - Error boundary wrapper
- `Tooltip.tsx` - Tooltip component
- `DarkModeToggle.tsx` - Theme switcher
- `TaskCard.tsx` - Task card display
- `ImageViewer.tsx` - Image viewer modal
- `ProtectedRoute.tsx` - Auth route protection

## Migration Plan - Phase 2

### Priority 1: Top Navigation (Critical)

**Goal:** Restore the header navigation bar

**Tasks:**

1. Create `HeaderNav.tsx` component with:
   - Mobile menu button
   - Session title display (with AgentLogo)
   - Project name display
   - Tab navigation (Chat/Shell/Files)

2. Update `App.tsx`:
   - Add `activeTab` state
   - Add HeaderNav above Layout
   - Pass tab switching handlers

3. Update `Layout.tsx`:
   - Accept HeaderNav as prop
   - Adjust layout structure

**Implementation:**

```tsx
// apps/agent-web/src/components/HeaderNav.tsx
interface HeaderNavProps {
  selectedProject: ProjectInfo | null;
  selectedSession: Session | null;
  activeTab: 'chat' | 'shell' | 'files';
  onTabChange: (tab: string) => void;
  onMenuClick: () => void;
  isMobile: boolean;
}

export function HeaderNav({ ... }: HeaderNavProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex-shrink-0">
      {/* Mobile menu button */}
      {/* Session title */}
      {/* Tab navigation */}
    </div>
  );
}
```

### Priority 2: Multi-Tab Support

**Goal:** Enable Shell and Files views

**Tasks:**

1. Migrate `Shell.tsx` component
   - Install xterm.js dependencies
   - Adapt WebSocket connection

2. Migrate `FileTree.tsx` component
   - File browser UI
   - File operations

3. Update `App.tsx`:
   - Add tab routing (chat/shell/files)
   - Conditional rendering based on activeTab

### Priority 3: Code Editor Integration

**Goal:** Enable side-by-side code editing

**Tasks:**

1. Fix CodeEditor CodeMirror dependencies
   - Install missing @codemirror/\* packages

2. Add resize functionality
   - Drag handle component
   - Width state management
   - Expand/collapse toggle

3. Integrate with ChatInterface
   - File open handler
   - Modal for mobile

### Priority 4: Settings & Configuration

**Goal:** Add settings panel

**Tasks:**

1. Migrate Settings.tsx (optional)
   - Or use simple modal with UIStore

2. Add DarkModeToggle (optional)
   - Or use system preference

3. Mobile optimization
   - Touch gestures
   - PWA support

## Technical Debt to Address

### 1. TypeScript Errors

- 188 TypeScript errors remain
- Most are in CodeEditor (missing deps)
- Some type mismatches in InputArea

### 2. Missing Dependencies

- CodeMirror packages
- May need to install additional xterm addons

### 3. Architecture Alignment

- Ensure EventBus integration for all components
- Zustand store subscriptions
- Consistent error handling

## Recommended Approach

### Step 1: Quick Win - Add HeaderNav (1-2 hours)

This immediately fixes the visual issue and improves navigation.

### Step 2: Multi-Tab Support (2-3 hours)

Enable Shell and Files tabs for feature parity.

### Step 3: Code Editor Polish (1-2 hours)

Fix dependencies and integrate properly.

### Step 4: Optional Enhancements (as needed)

Settings, mobile optimization, etc.

## Summary

**Critical Missing:**

- Top Navigation Bar (HeaderNav)
- Tab switching system

**Important Missing:**

- Shell integration
- File tree browser
- Code editor integration

**Optional Missing:**

- Settings panels
- Mobile optimizations
- Error boundaries

**Next Immediate Action:**
Create HeaderNav component to restore the missing top navigation bar.
