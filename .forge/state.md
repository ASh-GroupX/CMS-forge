# Current State

Status: UX gap closure implementation proof complete; human usability validation pending
Phase: ui-ux-redesign
Next Task: Run 6-person usability validation for UX Gap Closure Plan, or record a signed deferral before phase review
Model Tier: GPT-5.5 Extra High or Opus 4.8 Max

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
- UI/UX refactor Slice 8 completed cleanup and hardening, including production `PreviewState` removal and raw color ratchet reduction.
- UI/UX refactor Slice 9 completed the final visual QA gate.
- Visual Rescue completed after user review found the app still felt visually unchanged: auth landing, staff shell, dashboard summary, work queue, and shared table headers showed a stronger Precision Ops hierarchy.
- Visual Rescue 2 completed a focused screenshot-led polish pass: staff auth and shell moved from heavy dark chrome to subtler semantic shell surfaces, shared table headers are sentence case, and shared status indicators now use quieter dot-style badges.
- Visual Rescue 3 completed the user-screenshot-led progressive-disclosure repair: Today tasks, Deal handoff, and Admin surfaces now default to read-first lists/tables, with create/update/add/edit forms closed until intent.
- Communication Control Desk Repair completed the requested 10/10-target production slice: shared EN/AR domain labels, complaint communication timeline, admin hub, reports delivery groups, permission-aware staff UI, mobile module switching, local panel errors, portal verification reset behavior, and deal handoff detail updates that do not advance stage.
- UX/Product Repair Plan completed the audit-finding fixes: portal manual triage fallback, deal handoff RBAC correction, denied/error state separation, production preview-query removal, work queue/report/workflow clarity fixes, and Arabic `nameAr` display fallback.
- Communication Control Usability Hardening completed the follow-up implementation for nontechnical users: portal manual-review fallback controls, server-backed due/SLA filtering before pagination, complaint detail denied/not-found states, latest-first communication timeline, destructive action confirmation, waiting-task next-action fields, and warning-token feedback.
- UX Gap Closure Plan completed the thin nontechnical clarity layer: portal "What happens next?" guidance, manual-review helper copy, employee Done/Waiting explanations, work queue Due status helper, complaint timeline visibility legend and Latest updates label, EN/AR proof coverage, and one accessibility repair for the comment visibility selector.
- `web:visual-review` writes English and Arabic HTML plus PNG artifacts for the covered staff and portal surfaces under `coverage/web-visual-review`, including auth landing, full staff shell, today tasks, deal handoff, admin, and portal mobile flows.
- Latest proof passed for UX Gap Closure Plan: `typecheck`, `lint`, `openapi:check`, `test:web -- shell`, `test:web -- localization`, `test:visual`, `web:visual-review`, and `test:e2e -- accessibility`.

## Current Stop

All code and automated proof for the UX Gap Closure Plan are complete. The plan's score can be finalized only after the 6-person usability validation passes, or after a signed deferral if the project accepts automated proof only. Per Forge policy, run a fresh phase review before starting another phase.

## Open Carry-Forward / Known Debt

- Exact Slice 11 compensation decision still needed: signed deferral, or approval for minimal compensation metadata and audit.
- Exact report decision still needed for RPT-002, RPT-003, RPT-005 through RPT-012, RPT-014, and RPT-016: signed MVP deferral or approval to implement missing report-specific outputs.
- Approved notification channels for remaining pilot/UAT proof still need final signoff.
- RPT-015 DMS lookup failure reporting is signed-deferred for manual-DMS pilot scope until a live/test provider exists and lookup telemetry is meaningful.
- The remaining off-token color lint ratchet is 33 matches in `apps/web/src/app` and `apps/web/src/components`; future migrated surfaces should continue shrinking it.
- UX Gap Closure human validation remains pending: 2 customers, 2 employees, and 2 managers.
- Generated proof artifacts under `coverage/` and `.playwright-cli/` remain intentionally unstaged.
