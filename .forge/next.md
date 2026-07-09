# UI/UX Refactor - UX Gap Closure Plan Complete

Status: Complete
Required model tier: GPT-5.5 Extra High or Opus 4.8 Max
Phase: ui-ux-redesign
Risk: Medium
SRS IDs: `ARCH-UI-001`, `UI-SCREEN-001`, `UI-DESIGN-001`, `QA-UI-001`, `REQ-LOCALIZATION-001`, `REQ-RBAC-001`, `PORTAL-SEC-001`, `CONTRACT-READINESS-002`

## Task

The requested 8.5/10 to 9.2/10 UX Gap Closure Plan has been implemented as a
thin nontechnical clarity layer. No backend feature, schema migration, new
dependency, OpenAPI behavior change, or permission model change was added.

Implemented scope:

- Portal submission now explains what happens after a successful complaint and
  uses plain manual-review fallback copy when option lists are unavailable.
- Employee task actions now explain `Done` versus `Waiting` inside the existing
  detail disclosure pattern.
- Work queue filters now include a `Due status` helper for late and nearly late
  cases, and staff-facing complaint detail labels use `Due status` language.
- Complaint communication timeline now labels `Latest updates` and explains
  `Customer visible` versus `Internal only`.
- EN/AR copy and proof signals were updated, including real Arabic RTL coverage
  and mojibake-marker checks.
- The accessibility proof exposed an unnamed complaint-comment visibility select;
  that selector now has the localized accessible name.

## Completed Slice Order

1. Slice 1B - Shared Shell Primitives
2. Slice 2 - Shared UI Primitives
3. Slice 3 - Staff Dashboard and Work Queue
4. Slice 4 - Complaint Create, Lookup, and Attachments
5. Slice 5 - Complaint Detail and Workflow
6. Slice 6 - Admin, Reports, Audit, and Notifications
7. Slice 7 - Customer Portal
8. Slice 8 - Cleanup and Hardening
9. Slice 9 - Final Visual QA Gate
10. Visual Rescue - Staff Operations Shell and Auth Landing
11. Visual Rescue 2 - Dense Shell Polish
12. Visual Rescue 3 - Screenshot-led Progressive Disclosure Repair
13. Communication Control Desk Repair - Domain labels, timeline, admin hub,
    reports clarity, permission-aware shell, and deal handoff safety
14. UX/Product Repair Plan - Manual triage, RBAC, denied states, preview-query
    removal, operational clarity, and Arabic admin naming
15. Communication Control Usability Hardening - Portal manual review fallback,
    server-backed due filtering, specific detail load states, latest-first
    timeline, destructive confirmation, and waiting-task next actions
16. UX Gap Closure Plan - Nontechnical clarity layer and proof refresh

## Final Proof

- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm openapi:check`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm test:visual`
- `corepack pnpm web:visual-review`
- `corepack pnpm test:e2e -- accessibility`

## Remaining Human Gate

Run 6 quick usability tests before claiming the final 9.2/10 score:

- 2 customers submitting or tracking a complaint.
- 2 employees deciding between Done and Waiting.
- 2 managers finding late or urgent cases with Due status.

Pass criteria remain: 5 of 6 complete without help, customers understand manual
review and reference number, employees understand Done versus Waiting, managers
find late or urgent cases with Due status, and no participant confuses Customer
visible with Internal only.

## Notes

- Automated proof supports the 9.2/10 target, but human validation is still
  `Needs Human Review`.
- Generated visual-review artifacts are under `coverage/web-visual-review`.
- Existing `.playwright-cli` scratch artifacts remain intentionally unstaged.
- Carry-forward business blockers remain listed in `.forge/state.md`.
