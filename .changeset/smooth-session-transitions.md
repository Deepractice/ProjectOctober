---
"@deepractice-ai/agent-web": patch
---

Add smooth transition animations for session switching

- Add Framer Motion fade and slide animations when switching sessions
- Fix mobile session click not working (passive event listener issue)
- Replace touch events with onClick for better mobile compatibility
- Improve session switching UX with 200ms smooth transitions
