# Current State

Status: User-scoped UX redesign Slice 2 complete
Phase: user-scoped-ux-redesign
Next Task: Slice 3 - Make attachments usable
Model Tier: GPT-5.5 Extra High

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Branch `codex/user-scoped-ux-redesign` is active.
- Slice 1 made `/portal` submit real customer complaints through the portal API proxy.
- Slice 2 now returns backend-derived complaint `allowedActions` for the current server session principal.
- Staff workflow UI renders only backend-provided actions for real complaint details and submits action/comment through the same-origin transition proxy.
- Workflow validation, success/error, and conflict reload/retry feedback are visible and localized.
- Workflow panel mobile sizing was tightened for English LTR and Arabic RTL.
- Screenshots were produced under `output/playwright/` and left unstaged.

## Current Stop

Proceed to Slice 3: make attachments usable.

## Open Carry-Forward / Known Debt

- Existing dirty files not related to this slice remain untouched.
- Arabic native date input placeholder is browser-controlled and remains for Slice 9 locale/responsive cleanup.
