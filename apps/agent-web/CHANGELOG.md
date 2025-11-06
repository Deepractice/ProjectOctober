# @deepractice-ai/agent-web

## 0.4.1

### Patch Changes

- 264b5b0: fix: update responsive breakpoint and remove unused agent-config dependency
  - Changed mobile viewport breakpoint from 768px to 1200px in agent-web for better iframe compatibility
  - Removed unused @deepractice-ai/agent-config dependency from agent-sdk
  - Added debug logging for viewport detection

  This fixes the issue where the application doesn't properly switch to mobile layout when embedded in an iframe with width < 1200px, and resolves NPM installation errors when agent-config is not published.

## 0.4.0

### Patch Changes

- 6619f80: Add smooth transition animations for session switching
  - Add Framer Motion fade and slide animations when switching sessions
  - Fix mobile session click not working (passive event listener issue)
  - Replace touch events with onClick for better mobile compatibility
  - Improve session switching UX with 200ms smooth transitions

## 0.3.0

### Minor Changes

- 08f270d: Add image upload functionality to chat interface
  - Install react-dropzone for file handling
  - Implement image selection via button click and drag-and-drop
  - Add image preview with removal capability
  - Convert images to base64 and send via WebSocket
  - Support multiple image formats (png, jpg, jpeg, gif, webp)
  - Display attached images in UI before sending
  - Integrate with existing message sending flow

## 0.2.3

## 0.2.2

## 0.2.1

### Patch Changes

- 63814c8: Add Aliyun Container Registry sync and implement lazy session creation
  - Add automatic Docker image synchronization to Aliyun ACR for faster access in China
  - Implement lazy session creation pattern (sessions created on first user message)
  - Fix TypeScript type errors in agent-sdk
  - Update UI with welcome screen and improved session navigation
  - Rename app title to "Deepractice Agent"

## 0.2.0

### Patch Changes

- 701027a: Remove AgentLogo icons from header and session list for cleaner UI

## 0.1.2

## 0.1.1

### Patch Changes

- d5dced5: Test patch release for runtime image build

## 0.1.0

### Minor Changes

- 997d45e: First publish
