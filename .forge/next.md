# Business Readiness Remediation - Slice 11

Status: Blocked pending Slice 0 human scope decision
Required model tier: GPT-5.5 Extra High
Phase: business-readiness-remediation
Risk: High
SRS IDs: `REQ-COMPLAINT-001`, `REQ-RBAC-001`, `METHOD-AUDIT-001`, `UI-SCREEN-001`, `UI-DESIGN-001`

## Task

Implement Slice 11 from `docs/BUSINESS_READINESS_PLAN.md`: Compensation decision.

## Scope Decision Required Before Build

Choose exactly one:

- Signed compensation deferral: document that compensation is not productized in the complaint MVP.
- Minimal compensation metadata in MVP scope: approve proposed/approved, amount when needed, status, approver, and audit.

## Scope After Decision

- If deferred, avoid schema/UI/API expansion and make the absence of compensation explicit.
- If in scope, keep compensation metadata, approval authority, branch scope, RBAC, and audit backend-owned.
- Do not add client-side compensation authority or placeholder UI that implies unavailable workflows are live.

## Proof

- Signed deferral, or `corepack pnpm test:api -- compensation` if implemented.

## Stop When

- No user can assume compensation is productized unless it is actually available.
