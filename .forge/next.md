# Business Readiness Remediation - Slice 5

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: business-readiness-remediation
Risk: High
SRS IDs: `REQ-SLA-001`, `METHOD-AUDIT-001`, `REQ-RBAC-001`, `UI-SCREEN-001`, `UI-DESIGN-001`

## Task

Implement Slice 5 from `docs/BUSINESS_READINESS_PLAN.md`: admin category and SLA UI.

## Scope

- Inspect the current admin category API, SLA API, web admin categories/SLA screen, API clients, and existing tests before editing.
- Provide real category list/create/edit/deactivate behavior.
- Provide the minimal SLA policy edit/view behavior required for MVP.
- Show config audit feedback.
- Keep RBAC, branch scope, SLA truth, and audit backend-owned.

## Proof

- `corepack pnpm security:check`
- `corepack pnpm test:api -- admin`, if registered
- Admin page screenshots.

## Stop When

- UAT-012 can be completed without direct database edits.
