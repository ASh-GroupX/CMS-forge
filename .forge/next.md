# Next Task: F1-05D - Branch Read/List HTTP Endpoints With Admin RBAC And OpenAPI

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 1 - Security Baseline

## Why This Exists

Branch read/list service behavior exists. Expose the read-only HTTP surface next,
using Admin-only RBAC and the canonical OpenAPI contract, while leaving writes and
audit-producing branch changes for later subtasks.

## Scope

- Add read-only branches routes:
  - `GET /branches`
  - `GET /branches/:idOrCode`
- Wire `BranchesModule` into the API app.
- Protect both routes with `SessionAuthGuard`, `RbacGuard`, and Admin-only roles.
- Keep controllers HTTP-only: validate/delegate/return service responses.
- Add focused `test:api -- admin` coverage for Admin allowed and non-admin denied.
- Document the read-only branch paths and response schemas in OpenAPI.

## Out Of Scope

- Branch create/update/deactivate behavior.
- Branch write audit entries.
- UI.
- Database schema or migration changes.
- Pattern-freeze documentation.

## Requirement IDs

- REQ-ADMIN-001
- METHOD-MODULAR-001
- METHOD-API-001
- METHOD-TEST-001
- NFR-MAINT-001
- NFR-SEC-002

## Acceptance Criteria

- Admin staff can call branch list/get routes.
- Non-admin staff are denied by the existing RBAC guard and denial audit behavior.
- Branch responses use `BranchResponseDto` shape from the service.
- Missing branches return a stable not-found-safe response.
- OpenAPI includes both branch read paths and schemas.
- Required checks pass and source files remain under the 300-line budget.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm test:api -- admin`
- `corepack pnpm openapi:check`

## Evidence To Record

Append `F1-05D - Branch Read/List HTTP Endpoints With Admin RBAC And OpenAPI`
to `.forge/evidence.md` with honest labels and the security self-check.

## Next After Completion

If checks pass, mark `F1-05D` done, write `F1-05E - Branch Create/Update/
Deactivate Service Behavior With Audit Entries` to `.forge/next.md`, and keep
`.forge/state.md` as `Ready to Build`.
