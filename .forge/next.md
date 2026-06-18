# Next Task

## F0-06 - Enforce Phase 0 Quality Gates

Status: Ready to Build
Required model tier: BUILDER-STANDARD
Risk: Medium

## Requirement IDs

- CONTRACT-READINESS-002
- CONTRACT-READINESS-003
- ARCH-STACK-001
- ARCH-API-001
- METHOD-MODULAR-001
- METHOD-API-001
- METHOD-TEST-001
- NFR-MAINT-001
- QA-UI-001
- UI-DESIGN-001

## Scope

Add the smallest real quality-gate foundation for the current scaffold:

1. Strengthen existing Node-based lint checks for architecture boundaries:
   - web must not import api, database, Prisma, or provider SDKs
   - api must not import web
   - packages must not import apps
   - future api modules must not import another module's repository, dto files, or Prisma internals
   - no TODO/FIXME markers in app/package source paths
2. Add a real coverage gate to the existing Node test command using Node's built-in test coverage thresholds.
3. Split OpenAPI generation/check behavior enough that `openapi:check` catches committed contract drift for the scaffold contract.
4. Keep visual, accessibility, and frontend performance proof commands honest: they may remain fail-loud pending gates while there are no real UI screens, but tests must prove they cannot silently pass.

## Expected Files

- `package.json`
- `tools/lint.mjs`
- `tools/lint.test.mjs`
- `tools/openapi-check.mjs`
- one small `tools/*.test.mjs` file if needed

Do not add ESLint, dependency-cruiser, Playwright, Lighthouse, or new app/domain modules in this task. Those belong when there is enough code or UI to check.

## Acceptance Criteria

- `corepack pnpm test` enforces coverage thresholds with Node's built-in test runner.
- `corepack pnpm lint` fails on the boundary violations listed above.
- `corepack pnpm openapi:check` fails when the committed scaffold OpenAPI file is non-canonical or missing required baseline error schemas.
- Pending proof commands for visual/a11y/perf stay fail-loud until real UI screens exist; do not report them as passed.
- No business logic, routes, database migrations, UI screens, or provider integrations are added.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm openapi:check`
- `corepack pnpm build`

## Evidence To Record

Append `F0-06 - Phase 0 Quality Gates` to `.forge/evidence.md` with honest Passed/Failed labels and cite the requirement IDs above.
Update `.forge/trust.md`, mark `F0-06` done in `.forge/backlog.md` only if all verification commands pass, and write the next task before finishing.
