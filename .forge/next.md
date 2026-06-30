# P20B - Staff DMS Lookup API

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: P20B
Risk: High
SRS IDs: ARCH-INTEGRATION-001, ARCH-API-001, API-STANDARD-001, REQ-CUSTOMER-001, DMS-MAP-001, DATA-AUTO-001, NFR-SEC-002, RBAC-MATRIX-001

## Scoped Task

Add the staff-only, read-only DMS lookup HTTP API on top of the reviewed P20A
adapter foundation.

The route must let authorized staff search by phone, customer number, VIN, or
name, return the safe normalized P20A lookup outcomes, document the route in
OpenAPI, and preserve manual fallback when DMS is unavailable, disabled,
not-found, or returns multiple matches.

## Scope

- Reuse the existing `integrations` module and P20A provider port/test double.
- Add a controller/DTO/API surface only if the route does not already exist.
- Enforce staff auth/RBAC from the server session.
- Return safe response DTOs only; no raw provider payloads or credentials.
- Cover success, multiple-match, not-found, provider-down/disabled, validation,
  allowed staff, and denied role/session cases.
- Update `.forge/evidence.md`, `.forge/state.md`, and `.forge/next.md` at task
  end.

## Likely Files

- `apps/api/src/modules/integrations/**`
- `apps/api/test/integrations/**`
- `packages/contracts/**`
- `docs/openapi/**` or generated OpenAPI artifact, if that is where this repo
  stores the committed contract
- `.forge/next.md`
- `.forge/state.md`
- `.forge/evidence.md`

## Skipped Work

- No live DMS provider, provider SDK, network call, or provider credentials.
- No DMS writeback endpoint or writeback service method.
- No frontend/customer portal DMS calls.
- No customer lookup UI; that is P20C.
- No schema migration or DMS persistence table unless OpenAPI generation proves
  one is already required by existing code.
- No reviewer catch-up for P18B/P19B/P19C inside this build commit.

## Required Proof

- `corepack pnpm test:api -- integrations`
- `corepack pnpm openapi:generate`
- `corepack pnpm openapi:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm security:check`
- `git status --short`
- `git diff --check`

## Reviewer Rule

Stop after P20B build and Forge updates. Do not start P20C until a fresh reviewer
pass reviews P20B, unless the user explicitly skips that review. If skipped,
record P20B as built but not reviewed.
