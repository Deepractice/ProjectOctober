---
"@deepractice-ai/agent": patch
---

fix: prevent duplicate message output in WebSocket stream

Fixed three duplicate message issues:

1. Tool result messages were sent twice (SDK transform + WebSocket forward)
2. Assistant messages appeared twice after streaming (streaming delta + complete message)
3. Text blocks in content arrays duplicated streaming content

Changes:

- Filter tool_result messages in WebSocket chat handler to prevent duplicate tool outputs
- Track streaming completion state to skip duplicate complete messages
- Apply streaming check to both string content and content array text blocks
