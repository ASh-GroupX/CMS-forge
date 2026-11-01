# CRM Complaint and Internal Ticket Reliability

Status: Implemented locally; production merge blocked by web shell suite failures
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
- `corepack pnpm test:web -- shell` is **Failed**: 41 of 223 tests fail across
  existing navigation, portal, complaint detail, DMS, reports, dashboard, and
  other staff UI expectations. The changed features have focused passing tests,
  but the suite failure must be assessed and the web shell gate green before
  production merge.
- After the shell suite is reconciled, push `waleed`, merge to `production`,
  and run deployment verification.

## Next Task

Replan the broad web shell failures into focused repairs; determine which are
stale test expectations versus runtime regressions. Do not suppress or skip the
failing checks to manufacture a pass.
