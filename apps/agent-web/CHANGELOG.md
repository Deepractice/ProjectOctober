# @deepractice-ai/agent-web

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
