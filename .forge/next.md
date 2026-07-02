# Business Readiness Remediation - Slice 7

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: business-readiness-remediation
Risk: High
SRS IDs: `REQ-COMPLAINT-001`, `REQ-COMPLAINT-004`, `PORTAL-SEC-001`, `REQ-RBAC-001`, `METHOD-AUDIT-001`, `UI-SCREEN-001`, `UI-DESIGN-001`

## Task

Implement Slice 7 from `docs/BUSINESS_READINESS_PLAN.md`: staff comments and public portal updates.

## Scope

- Inspect current complaint comments/status history, portal tracking, and existing workflow/portal tests before editing.
- Add or wire staff detail comment composer/list with explicit internal versus public visibility.
- Ensure public portal tracking shows only public updates after verification.
- Keep comment authorization, branch scope, audit, and portal verification backend-owned.

## Proof

- `corepack pnpm test:api -- workflow`
- `corepack pnpm test:api -- portal.tracking`
- Staff and portal screenshots.

## Stop When

- UAT-006 passes with internal note hidden from the portal and public update visible after verification.
