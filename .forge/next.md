# CRM Complaint and Internal Ticket Reliability

Status: Implemented on `waleed`; production merge blocked by web shell suite failures
Required model tier: GPT-5.5 Extra High or equivalent
Risk: High (complaint workflow, staff attachments, audit visibility)
SRS IDs: `REQ-FILES-001`, `REQ-COMPLAINT-001`, `REQ-CUSTOMER-001`,
`DATA-AUTO-001`, `REQ-RBAC-001`, `WORKFLOW-MATRIX-001`, `METHOD-AUDIT-001`,
`METHOD-API-001`, `METHOD-TEST-001`, `ARCH-UI-001`, `UI-DESIGN-001`

## Completed Scope

- Fixed staff photo support for JPG, PNG, and WebP in complaint creation and
  internal ticket creation/notes. Preserved the customer portal upload policy.
- Kept failed complaint-note files retryable and surfaced partial upload failure.
- Added optional make, model/type, and year inputs to complaint creation, with
  DMS values prefilled when available.
- Added a collapsed, complaint-scoped audit section gated by `AUDIT_VIEW`.
- Renamed the existing `COMPLETED` display label and board stage from
  “Customer Contacted” to “Completed”; workflow state remains unchanged.

## Required Release Gate

- Focused attachment tests, web API-client/localization tests, typecheck, lint,
  security check, OpenAPI check, migration sanity, build, and visual proof pass.
- `corepack pnpm test:web -- shell` is **Failed**: 41 of 223 tests fail on the
  feature branch (182 passed). Failures span navigation, portal, complaint
  detail/create, DMS, reports, dashboard, and other staff UI expectations. The
  same failure list reproduces at `origin/production` commit `093033f`, so these
  are baseline failures as well as a release blocker.
- Focused attachment, API-client, localization, typecheck, lint, OpenAPI, and
  diff checks passed after the latest edits. Root `corepack pnpm test` did not
  complete in the local environment; the process stalled after 69 emitted
  subtests and was stopped. Do not report it as passed.
- The deploy workflow seeds `TICKETS_COMPLETED` on every deploy; its label now
  matches the requested Completed label instead of overwriting it as Customer
  Contacted.
- Do not merge or deploy while the required full shell gate is red. Reconcile
  production-baseline UI failures as a separately reviewed repair task, then
  rerun the full release proof.

## Next Task

Replan the 41 production-baseline shell failures into scoped repairs; determine
which are obsolete expectations versus runtime defects. Do not suppress or skip
failing checks to manufacture a pass.
