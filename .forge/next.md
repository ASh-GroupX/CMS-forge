# Business Readiness Remediation - Slice 4

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: business-readiness-remediation
Risk: High
SRS IDs: `METHOD-AUDIT-001`, `NFR-SEC-002`, `REQ-RBAC-001`, `UI-SCREEN-001`, `UI-DESIGN-001`

## Task

Implement Slice 4 from `docs/BUSINESS_READINESS_PLAN.md`: real audit viewer.

## Scope

- Inspect the current audit API, repository, web audit viewer, API client, and existing tests before editing.
- Replace placeholder audit rows with backend search results.
- Wire filters and export.
- Add empty, loading, error, and denied states.
- Keep audit access, export permission, branch scope, redaction, and append-only behavior backend-owned.

## Proof

- `corepack pnpm test:api -- audit`
- Docker append-only proof when Docker is available.
- `corepack pnpm test:e2e -- accessibility`
- Screenshot in English and Arabic.

## Stop When

- Admin can search/export real audit records from the app.
