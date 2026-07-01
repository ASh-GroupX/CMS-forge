# User-Scoped UX Redesign - Slice 6

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: user-scoped-ux-redesign
Risk: High
SRS IDs: REQ-CUSTOMER-001, ARCH-INTEGRATION-001, DMS-MAP-001, REQ-LOCALIZATION-001, UI-SCREEN-001, UI-DESIGN-001, NFR-SEC-002

## Task

Fix DMS lookup and provenance correction.

## Scope

- Re-read Slice 6 in `docs/USER_SCOPED_UX_REDESIGN_PLAN.md`.
- Inspect the customer/vehicle lookup component, provenance correction panel, DMS proxy route, typed clients, and existing API/web tests before editing.
- Ensure DMS result selection fills canonical customer and vehicle IDs when present.
- Show enough fields to choose the right match: name, phone, customer number, VIN, plate, brand, model, branch, and source.
- Keep manual fallback available when DMS is down.
- Require an audit-safe reason when manually overriding DMS-matched data.
- Never expose DMS codes to the customer portal.
- Do not move DMS provider calls, secrets, branch scope, RBAC, workflow authority, portal privacy, audit, or attachment authority into React.

## Proof

- `corepack pnpm test:api -- dms-adapter`
- `corepack pnpm test:api -- customers`
- `corepack pnpm test:web -- localization`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm openapi:check` when API/contracts/routes changed
- `git diff --check`
