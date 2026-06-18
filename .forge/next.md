# Next Task: F0-04 - Seed Data For Branches, Roles, Users, Categories, Vehicles, Complaints

## Model Guidance

- Tier: BUILDER-STRONG
- Why: Seed data runs against the real Prisma schema + PostgreSQL; it requires the database package, realistic reference data, and must not leak credentials or bypass RBAC assumptions baked into later tests.
- Escalate to: PLANNER if the Prisma schema is not ready or the seed scope conflicts with F0-08 (coherent data model).
- Do not use: BUILDER-SMALL.

## Requirement IDs

- ARCH-DATA-001
- CONTRACT-READINESS-001
- METHOD-AUDIT-001
- REQ-ADMIN-001
- UI-DESIGN-001 (seed provides the realistic data for visual states)

## Task

Add a database seed script that populates the local development stack with
reference data: at least two branches, all system roles, an admin user per
branch, sample categories, a few vehicle records, and two or three complaints
in different states.

Keep this as data plumbing only. Do not implement domain modules, business
rules, workflow behavior, auth sessions, or RBAC enforcement.

## Scope

Allowed files and directories:

- `packages/database/**`
- `apps/api/**` (only if the seed needs a prisma client entry point)
- `package.json` (add `db:seed` script if missing)
- `pnpm-lock.yaml`
- `tools/**`

Do not modify:

- `docs/CMS_AUTO_SRS.md`
- `docs/ARCHITECTURE.md`
- `CLAUDE.md`
- `AGENTS.md`
- `.forge/forge.md`
- `.forge/policy.md`
- `.forge/models.md`

## Implementation Requirements

- Use `packages/database/prisma/seed.ts` or `seed.mjs`; run via `prisma db seed`.
- Roles must match the stable codes in the SRS (ADMIN, CR_MANAGER, BRANCH_MANAGER, AGENT, CUSTOMER_SERVICE, VIEWER, PORTAL).
- No real email addresses, real credentials, or production secrets in seed data.
- Seed must be idempotent (upsert, not plain insert) so it can run more than once safely.
- Connection string comes from `DATABASE_URL` env var only.

## Must Pass

Run and report honestly:

- `corepack pnpm install --lockfile-only`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm openapi:check`
- `docker compose config --quiet`

If the seed itself requires a live database, mark `db:seed` as `Needs Human Review` and explain how to run it manually.

## Exit Criteria

- `packages/database/prisma/seed.ts` (or `.mjs`) exists and is idempotent.
- `db:seed` script or Prisma seed config is wired in.
- Baseline proof commands still pass.
- `.forge/evidence.md`, `.forge/trust.md`, `.forge/backlog.md`, `.forge/state.md`, and `.forge/next.md` are updated before finishing.
