---
"@deepractice-ai/agent": patch
---

Fix DiffDisplay crash when loading sessions with Edit/Write tool history

Fixed a critical bug where the application would crash with "createDiff(...).map is not a function" error when loading historical sessions containing Edit or Write tool calls. The issue was caused by using a stub implementation that returned an empty string instead of properly using the useDiffCalculation hook that returns an array of diff objects.
