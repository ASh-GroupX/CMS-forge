# Current State

Status: User-scoped UX redesign Slice 5 complete
Phase: user-scoped-ux-redesign
Next Task: Slice 6 - Fix DMS lookup and provenance correction
Model Tier: GPT-5.5 Extra High

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Branch `codex/user-scoped-ux-redesign` is active.
- Slice 1 made `/portal` submit real customer complaints through the portal API proxy.
- Slice 2 returns backend-derived complaint `allowedActions` for the current server session principal.
- Slice 3 added staff attachment list/upload/download wiring through backend-scoped routes and same-origin web proxies.
- Slice 4 made staff queue filters/search/pagination URL-backed and API-backed via `/complaints/search`, with mobile queue cards and main-first staff layout.
- Slice 5 exposes server-scoped customer and vehicle detail data in complaint detail responses and renders it in the staff detail workspace.
- Complaint detail now shows a summary header for status, severity, owner, SLA, next backend-provided action, and locale-aware last update.
- Detail timelines now render locale-aware English/Arabic dates instead of raw timestamp strings.
- Public updates and internal comments remain visually separated; workflow actions and all authority remain backend-owned.
- Screenshots were produced under `output/playwright/` and left unstaged.

## Current Stop

Proceed to Slice 6: fix DMS lookup and provenance correction.

## Open Carry-Forward / Known Debt

- Existing dirty files not related to this slice remain untouched.
- Arabic native date input placeholder is browser-controlled and remains for Slice 9 locale/responsive cleanup.
- Browser-native file input text remains Chrome-controlled and may appear in English on Arabic screens; remains for Slice 9 locale/responsive cleanup.
