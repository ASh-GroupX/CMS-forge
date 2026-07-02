# Business Readiness Remediation - Slice 3

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: business-readiness-remediation
Risk: High
SRS IDs: NFR-SEC-002, REQ-RBAC-001, REQ-REPORT-001, PORTAL-SEC-001

## Task

Implement Slice 3 from `docs/BUSINESS_READINESS_PLAN.md`: management-readonly masking for complaint queue/detail/report rows and sensitive export denial or masking without explicit permission.

## Scope

- Inspect current role permissions, complaints/reports services, report export behavior, UI display, and existing tests before editing.
- Enforce masking at the API response/export layer, not in React.
- Management-readonly must not receive unmasked customer phone, email, VIN, plate, compensation notes, or attachment filenames by default.
- Keep CR/branch roles able to see fields they are already allowed to see.

## Proof

- `corepack pnpm security:check`
- `corepack pnpm test:api -- reports`
- One focused allowed/denied masking test.
