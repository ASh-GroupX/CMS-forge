# Next Task: F1-00A - Generate And Apply The F0-08 Prisma Migration

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High

## Why This Exists

Phase 0 accepted the F0-08 Prisma schema draft, but the committed migration still
only reflects the smaller F0-04 model. Phase 1 auth depends on the expanded user,
session, audit, and related security tables existing in the database.

## Scope

Generate a committed Prisma migration from the current F0-08
`packages/database/prisma/schema.prisma` and prove it applies through the Docker
network on Windows.

Keep the task to migration work only. Do not bootstrap NestJS, do not implement
auth, and do not add routes, controllers, UI, RBAC guards, audit services, or
business logic.

If migration generation or proof needs more than 1 to 5 files plus focused test
or script changes, stop and replan instead of expanding the diff.

Any new app/package/tool source file must stay under 300 lines. Migration files,
docs, generated files, and other canonical artifacts remain exceptions.

## Requirement IDs

- CONTRACT-READINESS-002
- ARCH-STACK-001
- ARCH-DATA-001
- METHOD-TEST-001

## Expected Files

- `packages/database/prisma/migrations/<timestamp>_f0_08_core_model/migration.sql`
- `.forge/evidence.md`
- `.forge/trust.md`
- `.forge/backlog.md`
- `.forge/next.md`
- `.forge/state.md`

## Acceptance Criteria

- A repeatable migration exists for the full F0-08 schema.
- The migration applies inside the Docker network, not through the Windows
  localhost Prisma path that is already known to fail with P1000.
- Existing seed compatibility is preserved or any seed issue is recorded as a
  repair task.
- No application source code, auth behavior, routes, or UI are implemented.
- Verification labels in `.forge/evidence.md` are honest.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm openapi:check`
- `corepack pnpm --filter @cms-auto/database exec prisma validate --schema prisma/schema.prisma`
- `docker compose up -d postgres`
- `docker run --rm --network cms-forge_default -v "${PWD}:/workspace:ro" -w /workspace -e DATABASE_URL="postgresql://cms_auto:cms_auto_dev@postgres:5432/cms_auto?schema=public" node:20-alpine sh -lc "npm exec --yes prisma@5.22.0 -- migrate deploy --schema packages/database/prisma/schema.prisma"`

## Evidence To Record

Append `F1-00A - Generate And Apply The F0-08 Prisma Migration` to
`.forge/evidence.md` with honest labels and cited SRS IDs.

If checks pass, mark `F1-00A` done in `.forge/backlog.md`, write `F1-00B` to
`.forge/next.md`, update `.forge/trust.md`, and keep `.forge/state.md` at
`Ready to Build`.
