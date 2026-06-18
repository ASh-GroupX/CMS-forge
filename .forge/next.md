# Next Task: F1-05B - Generate Branches Module Shell And Manifest

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 1 - Security Baseline

## Why This Exists

`F1-05A` made the module generator emit a NestJS skeleton. Create the real
`branches` module from that generator before adding CRUD behavior, so the golden
reference starts from the canonical shape.

## Scope

- Run the generator for `branches`.
- Fill the generated `apps/api/src/modules/branches/MODULE.md` with the real
  public surface, owned `branches` table, allowed dependencies, and SRS IDs.
- Keep generated controller/service/repository/DTO/spec files behavior-free.
- Do not import `BranchesModule` into the app yet unless the generated skeleton
  requires it to typecheck.

## Out Of Scope

- Branch CRUD endpoints.
- RBAC guards or audit writes for branches.
- OpenAPI route changes.
- Database schema or migration changes.
- Editing existing `auth` or `audit` modules.

## Requirement IDs

- METHOD-MODULAR-001
- NFR-MAINT-001
- METHOD-TEST-001
- REQ-ADMIN-001

## Acceptance Criteria

- `apps/api/src/modules/branches` exists and was generated from the Nest-ready
  generator.
- `MODULE.md` is filled for the branches boundary and passes the manifest lint
  gate.
- Generated source remains under the 300-line budget.
- No runtime API behavior changes.
- Required checks pass.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm openapi:check`

## Evidence To Record

Record the `.forge/policy.md` Security Self-Check because this is a High-risk
Phase 1 foundation task. Keep the umbrella `F1-05` backlog item open until CRUD,
RBAC, audit, and pattern-freeze evidence are complete.
