# Business Readiness Remediation - Slice 6

Status: Ready with caveat
Required model tier: GPT-5.5 Extra High
Phase: business-readiness-remediation
Risk: High
SRS IDs: `REQ-REPORT-001`, `REQ-RBAC-001`, `METHOD-AUDIT-001`, `UI-SCREEN-001`, `UI-DESIGN-001`

## Task

Implement Slice 6 from `docs/BUSINESS_READINESS_PLAN.md`: report matrix completion or signed deferral.

## Scope

- Inspect the current report matrix, report service, reports dashboard, i18n, API client/export path, and existing report tests before editing.
- Either deliver missing report outputs or make signed deferrals explicit.
- Label generic operational row export honestly.
- Keep branch scope and export audit backend-owned.

## Caveat

- Delivering missing report outputs can proceed.
- Choosing signed deferrals depends on the unresolved Slice 0 human signoff for report deferrals; document the exact signoff needed if implementation cannot proceed without that choice.

## Proof

- `corepack pnpm test:api -- reports`
- `corepack pnpm test:web -- localization`
- Report screenshots.

## Stop When

- Every RPT ID is either delivered or signed deferred, and the UI says so.
