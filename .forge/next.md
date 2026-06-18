# Next Task

## F0-08 - Coherent Prisma Data Model Draft

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High

## Requirement IDs

- CONTRACT-READINESS-002
- ARCH-DATA-001
- ARCH-WORKFLOW-001
- METHOD-AUDIT-001
- API-STANDARD-001
- REQ-ADMIN-001
- REQ-CUSTOMER-001
- REQ-COMPLAINT-001
- SLA-CALENDAR-001
- PORTAL-SEC-001
- ARCH-STACK-001
- METHOD-MODULAR-001
- METHOD-TEST-001

## Scope

Draft the coherent Prisma schema before feature migrations:

1. Expand `packages/database/prisma/schema.prisma` from the seed-era minimal model to the MVP core data model named in `docs/ARCHITECTURE.md` and the SRS.
2. Include complaint status history, audit logs, departments, approvals, attachments, comments, SLA policies/events, notifications, surveys, compensation, and portal verification/session support.
3. Keep enums stable UPPER_SNAKE codes and mapped DB names snake_case.
4. Preserve existing seeded model intent where possible; update seed only enough to compile against the schema.
5. Add or update the smallest schema-focused test/check needed to catch missing core tables or missing complaint history/audit support.

## Expected Files

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/seed.ts`
- `tools/*.mjs` / `tools/*.test.mjs` only if needed for schema assertions

Do not implement API modules, routes, UI, business services, workflow logic, jobs, OpenAPI paths, or provider adapters in this task. Do not run destructive migrations on a shared database.

## Acceptance Criteria

- Prisma schema contains the MVP core tables and relationships required before feature migrations.
- Existing seed data compiles against the expanded schema.
- Complaint status history and audit log storage exist as first-class models, not JSON-only blobs.
- Tests or checks fail if core schema tables are missing.
- Existing lint, typecheck, test coverage, OpenAPI check, and build gates still pass.

## Verification Commands

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm openapi:check`
- `corepack pnpm build`

## Evidence To Record

Append `F0-08 - Coherent Prisma Data Model Draft` to `.forge/evidence.md` with honest Passed/Failed labels and cite the requirement IDs above.
Update `.forge/trust.md`, mark `F0-08` done in `.forge/backlog.md` only if all verification commands pass, and write the next task before finishing.
