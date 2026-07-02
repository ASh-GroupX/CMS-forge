# Business Readiness Remediation - Slice 10

Status: Blocked pending Slice 0 human scope decision
Required model tier: GPT-5.5 Extra High
Phase: business-readiness-remediation
Risk: High
SRS IDs: `REQ-INTEGRATION-001`, `REQ-REPORT-001`, `REQ-RBAC-001`, `METHOD-AUDIT-001`, `UI-SCREEN-001`, `UI-DESIGN-001`

## Task

Implement Slice 10 from `docs/BUSINESS_READINESS_PLAN.md`: DMS pilot mode.

## Scope Decision Required Before Build

Choose exactly one:

- Signed manual-DMS pilot scope: make disabled/manual lookup state explicit and reportable.
- Live/test DMS required: wire the provider through the existing backend DMS port.

Also decide whether RPT-015 is deferred. Persist safe lookup telemetry only if RPT-015 is not deferred.

## Scope After Decision

- Inspect integrations module, DMS lookup port/adapters, customer vehicle lookup UI, reports matrix, and existing integration tests before editing.
- Keep provider calls, secrets, branch scope, RBAC, audit, and lookup telemetry backend-owned.
- Do not add frontend provider calls or expose DMS codes/private provider data.

## Proof

- `corepack pnpm test:api -- integrations`
- Screenshots for match, multiple match, provider down, and manual fallback.

## Stop When

- UAT-001 and UAT-002 are either proven or explicitly scoped.
