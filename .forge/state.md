# Current State

Status: P14A complete
Phase: Phase 14 - Workflow state repair
Next Task: P14B workflow state repair
Model Tier: GPT-5 High or Opus 4.8 Max

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- P12C remains complete:
  - Route authorization uses permission-backed guards for admin, audit, report,
    complaint, attachment, notification, survey, case, deal, and task routes.
  - Branch-scope enforcement remains server-session-derived through
    `RbacGuard`; write routes keep `CsrfGuard`.
  - Customer portal routes remain portal-session/public-token based where
    scoped.
- P13 remains complete:
  - Submitted complaint references use
    `CMS-{YYYY}-{BRANCHCODE}-{SEQUENCE}`.
  - Reference sequence is DB-backed by branch/year in
    `complaint_reference_sequences`.
  - Staff drafts store internal `DRAFT-*` values and do not allocate
    customer-facing `CMS-*` references until submitted.
  - Draft `SUBMIT` assigns the `CMS-*` reference in the same status update
    transaction.
  - Portal complaint submission still returns a submitted `CMS-*` reference and
    cannot create staff drafts.
  - Complaint intake persists `departmentId` and links/upserts vehicle records
    from `vehicleId` or VIN plus supplied vehicle fields.
  - Duplicate reference conflicts retry once on create and fail safely with
    `COMPLAINT_REFERENCE_CONFLICT`.
- P14A is complete:
  - The smallest failing workflow path was an out-of-scope complaint transition
    denial where `RbacGuard` wrote the raw request URL into the
    `branch_scope_forbidden` audit target.
  - `RbacGuard` now stores the request path for RBAC/branch-scope route denial
    audit targets, so sensitive query names/values are not retained.
  - Workflow regression coverage proves a denied transition URL containing
    `sessionToken` is audited as `/complaints/cmp_1/transitions`.
- P14A proof passed:
  - `corepack pnpm test:api -- workflow` (48/48)
  - `corepack pnpm test:api -- audit` (8/8 plus append-only proof)
  - `corepack pnpm test:api -- rbac` (2/2)
  - `corepack pnpm openapi:check`
  - `corepack pnpm typecheck`
  - `corepack pnpm lint`
  - `git diff --check` (line-ending warnings only)

## Open carry-forward / known debt

- P14B should continue workflow state repair without pulling in SLA/report/UI
  changes. Compare `WORKFLOW-MATRIX-001` required data and actor authority
  against `applyTransition`, especially assigned-owner authority and owner/route
  data for branch-review transitions.
- P13 deliberately left duplicate warning UI and related complaint linking out
  of scope.
- Vehicle manual/DMS provenance flags are not yet first-class in the current
  vehicle schema.
