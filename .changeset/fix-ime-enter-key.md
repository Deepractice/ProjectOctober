---
"@deepractice-ai/agent": patch
---

fix: prevent Enter key from sending message during IME composition

Fixed issue where pressing Enter to select IME (Input Method Editor) candidates would incorrectly trigger message send. This affected users typing in Chinese, Japanese, Korean, and other languages using input methods.

Changes:

- Add isComposing check to handleKeyDown to distinguish between IME confirmation and actual message send
- Enter key now only sends message when not in IME composition state
