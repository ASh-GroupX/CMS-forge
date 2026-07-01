# Current State

Status: User-scoped UX redesign complete through Slice 9
Phase: user-scoped-ux-redesign
Next Task: None - user-scoped UX redesign slices complete
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
- Slice 6 adds optional local IDs to DMS lookup matches, displays them when present, and uses them for provenance correction only when provided.
- Slice 7 adds safe customer/branch labels to relation responses and lets staff unlink related complaints through the backend-owned relation route.
- Slice 8 makes reports filter by date range, branch, category, severity, owner, and department where available; export links now use those same scoped filters only after real report rows load.
- Reports now show guarded delivered/deferred catalog status instead of pretending deferred reports are complete.
- Slice 9 localizes guarded report catalog values in Arabic, gives disabled report exports an unavailable reason, keeps related/duplicate complaint headings visible in empty states for accessibility, and constrains reports table overflow on narrow viewports.
- DMS lookup/correction, related complaint writes, report authorization, branch scope, row limits, and export audit still flow through backend adapters/proxies and scoped routes; no DMS writeback, destructive merge, frontend provider/relation authority, or frontend report authority was added.
- Screenshots were produced under `output/playwright/` and left unstaged.

## Current Stop

User-scoped UX redesign slices are complete.

## Open Carry-Forward / Known Debt

- Existing dirty files not related to this slice remain untouched.
- The plan names `test:api -- dms-adapter` and `test:api -- customers`, but this repo's API runner registers `integrations` and `complaints` for the covered behavior.
- The plan names `test:e2e -- complaint-related`, but this repo's e2e runner does not register that suite.
- Browser-native date and file input chrome is still controlled by the browser; product labels and values around those controls are localized.
