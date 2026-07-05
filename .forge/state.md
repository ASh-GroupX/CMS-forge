# Current State

Status: UI/UX redesign Slice 1B complete; Slice 2 ready
Phase: ui-ux-redesign
Next Task: Slice 2 - Shared UI primitives
Model Tier: GPT-5.5 Extra High

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Branch `codex/user-scoped-ux-redesign` is active.
- The old Business Readiness Slice 11 compensation task remains blocked and is now carry-forward debt, not the active Forge task.
- The full UI/UX refactor packet is stored in `.forge/ui-ux-refactor/README.md`; `.forge/ui-ux-refactor-roadmap.md` is only a compatibility pointer.
- UI/UX refactor Slice 0 established the browser proof harness and Precision Ops token spine.
- UI/UX refactor Slice 1B completed shared shell primitives for staff and portal routes.
- Staff shell now has skip link, compact topbar/sidebar, active route helper coverage, role-aware navigation, server-session authority, and focus-visible keyboard path.
- Portal shell now has localized navigation, language switch, skip link, trust/privacy footer, mobile-first touch targets, and semantic shell tokens.
- `web:visual-review` writes English and Arabic HTML plus PNG artifacts for the covered staff and portal surfaces under `coverage/web-visual-review`.
- Lint retains the frontend raw color utility ratchet for `apps/web/src/app` and `apps/web/src/components`; current baseline is 455 matches.
- Proof passed for Slice 1B: `typecheck`, `lint`, `test:web -- shell`, `test:web -- localization`, `test:visual`, `web:visual-review`, `test:e2e -- accessibility`, `web:perf`, and `git diff --check`.

## Current Stop

Proceed with Slice 2 only: shared UI primitives.

## Open Carry-Forward / Known Debt

- Exact Slice 11 compensation decision still needed: signed deferral, or approval for minimal compensation metadata and audit.
- Exact report decision still needed for RPT-002, RPT-003, RPT-005 through RPT-012, RPT-014, and RPT-016: signed MVP deferral or approval to implement missing report-specific outputs.
- Approved notification channels for remaining pilot/UAT proof still need final signoff.
- RPT-015 DMS lookup failure reporting is signed-deferred for manual-DMS pilot scope until a live/test provider exists and lookup telemetry is meaningful.
- Existing off-token color debt is intentionally ratcheted, not removed in Slice 0; later slices should reduce the 455-match baseline as screens migrate.
- Generated proof artifacts under `coverage/` remain intentionally unstaged.
