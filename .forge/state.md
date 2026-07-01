# Current State

Status: User-scoped UX redesign Slice 4 complete
Phase: user-scoped-ux-redesign
Next Task: Slice 5 - Make complaint detail understandable
Model Tier: GPT-5.5 Extra High

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Branch `codex/user-scoped-ux-redesign` is active.
- Slice 1 made `/portal` submit real customer complaints through the portal API proxy.
- Slice 2 now returns backend-derived complaint `allowedActions` for the current server session principal.
- Staff workflow UI renders only backend-provided actions for real complaint details and submits action/comment through the same-origin transition proxy.
- Slice 3 added staff attachment list/upload/download wiring through backend-scoped routes and same-origin web proxies.
- Staff and verified portal attachment uploads now share early browser file validation while backend policy remains authoritative.
- Attachment scan state, empty/error, upload, and authorized-download feedback are visible and localized.
- Slice 4 made staff queue filters/search/pagination URL-backed and API-backed via `/complaints/search`.
- Staff queue scope remains backend/session-owned; React sends no role, actor, owner, workflow, or authorization fields.
- Staff layout includes skip-to-main and mobile ordering puts main work content before sidebar navigation.
- Mobile queue rows render as compact cards for English LTR and Arabic RTL instead of requiring horizontal table scrolling.
- Screenshots were produced under `output/playwright/` and left unstaged.

## Current Stop

Proceed to Slice 5: make complaint detail understandable.

## Open Carry-Forward / Known Debt

- Existing dirty files not related to this slice remain untouched.
- Arabic native date input placeholder is browser-controlled and remains for Slice 9 locale/responsive cleanup.
- Browser-native file input text remains Chrome-controlled and may appear in English on Arabic screens; remains for Slice 9 locale/responsive cleanup.
