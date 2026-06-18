# Next Task

## F0-07 - Module Generator Template And Golden CRUD Designation

Status: Ready to Build
Required model tier: BUILDER-STANDARD
Risk: Medium

## Requirement IDs

- CONTRACT-READINESS-002
- ARCH-STACK-001
- METHOD-MODULAR-001
- METHOD-API-001
- METHOD-TEST-001
- NFR-MAINT-001

## Scope

Add the smallest module generator foundation:

1. Add a dependency-free Node script that creates the canonical Nest module skeleton under `apps/api/src/modules/<module>/`.
2. Generate only structure: module, controller, service, repository, DTO placeholders, and service/controller spec placeholders.
3. Reject invalid module names and refuse to overwrite an existing module.
4. Document that `branches` is the future golden CRUD reference, but do not implement CRUD behavior yet.
5. Add one focused test proving the generator creates the expected files and refuses overwrite.

## Expected Files

- `package.json`
- `tools/generate-module.mjs`
- `tools/generate-module.test.mjs`
- `docs/ARCHITECTURE.md` only if needed to record the golden CRUD designation already stated there

Do not add plop or another generator dependency. Do not create real domain modules, routes, database changes, CRUD logic, RBAC, audit, or OpenAPI paths in this task.

## Acceptance Criteria

- `corepack pnpm generate:module -- branches` creates the canonical skeleton in an empty workspace path.
- The generator refuses invalid names and existing module directories.
- Tests cover creation and overwrite rejection.
- Existing lint, typecheck, test coverage, OpenAPI check, and build gates still pass.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm openapi:check`
- `corepack pnpm build`

## Evidence To Record

Append `F0-07 - Module Generator Template And Golden CRUD Designation` to `.forge/evidence.md` with honest Passed/Failed labels and cite the requirement IDs above.
Update `.forge/trust.md`, mark `F0-07` done in `.forge/backlog.md` only if all verification commands pass, and write the next task before finishing.
