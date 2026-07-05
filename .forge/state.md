# Current State

Status: UI/UX redesign Slice 7 complete; Slice 8 ready
Phase: ui-ux-redesign
Next Task: Slice 8 - Cleanup and Hardening
Model Tier: GPT-5.5 Extra High

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Branch `codex/user-scoped-ux-redesign` is active.
- The old Business Readiness Slice 11 compensation task remains blocked and is now carry-forward debt, not the active Forge task.
- The full UI/UX refactor packet is stored in `.forge/ui-ux-refactor/README.md`; `.forge/ui-ux-refactor-roadmap.md` is only a compatibility pointer.
- UI/UX refactor Slice 0 established the browser proof harness and Precision Ops token spine.
- UI/UX refactor Slice 1B completed shared staff and portal shell primitives.
- UI/UX refactor Slice 2 completed shared UI primitives and wired them into current duplicated screen patterns.
- UI/UX refactor Slice 3 completed the staff dashboard and work queue refactor.
- UI/UX refactor Slice 4 completed complaint create, lookup, and attachments as one structured intake flow.
- UI/UX refactor Slice 5 completed complaint detail and workflow as an operational workbench.
- UI/UX refactor Slice 6 completed admin, reports, audit, and notification surfaces.
- UI/UX refactor Slice 7 completed customer portal surface hardening for submit, tracking, follow-up, attachments, and survey.
- Slice 7 reused shared state and badge primitives, strengthened existing localized privacy/status messaging, and made portal controls more mobile-friendly while preserving backend-owned portal verification.
- `web:visual-review` writes English and Arabic HTML plus PNG artifacts for the covered staff and portal surfaces under `coverage/web-visual-review`.
- Lint retains the frontend raw color utility ratchet for `apps/web/src/app` and `apps/web/src/components`; current baseline is 455 matches.
- Proof passed for Slice 7: `typecheck`, `lint`, `test:web -- shell`, `test:web -- localization`, `test:visual`, `web:visual-review`, `test:e2e -- accessibility`, `web:perf`, and `git diff --check`.

## Current Stop

Proceed with Slice 8 only: cleanup and hardening.

## Open Carry-Forward / Known Debt

- Exact Slice 11 compensation decision still needed: signed deferral, or approval for minimal compensation metadata and audit.
- Exact report decision still needed for RPT-002, RPT-003, RPT-005 through RPT-012, RPT-014, and RPT-016: signed MVP deferral or approval to implement missing report-specific outputs.
- Approved notification channels for remaining pilot/UAT proof still need final signoff.
- RPT-015 DMS lookup failure reporting is signed-deferred for manual-DMS pilot scope until a live/test provider exists and lookup telemetry is meaningful.
- Existing off-token color debt is intentionally ratcheted; Slice 8 should reduce the 455-match baseline where safe.
- Generated proof artifacts under `coverage/` and `.playwright-cli/` remain intentionally unstaged.
