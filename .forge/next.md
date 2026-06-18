# Next Task: F2-01A - Add Complaint Transition History Metadata Schema And Migration

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High
Phase: Phase 2 - Complaint Core

## Why This Exists

F0-08 already created the complaint-core tables and F1-00A already applied that
migration. The schema covers complaints, comments, attachments, approvals, SLA
events, notifications, portal verification, and audit logs. The remaining schema
gap for `ARCH-WORKFLOW-001` + `WORKFLOW-MATRIX-001` is transition provenance:
`complaint_status_history` records from/to status, actor, timestamp, reason, and
correlation ID, but does not yet store the transition action, actor role, or
request source required for every workflow transition.

## Scope

Edit only:

- `packages/database/prisma/schema.prisma`
- a new Prisma migration under `packages/database/prisma/migrations/`
- `tools/schema-check.mjs` and `tools/schema-check.test.mjs` if needed to guard
  the new history metadata fields

Do not add complaint services, routes, state-machine behavior, OpenAPI paths, UI,
jobs, or notification logic in this task.

## Requirements

- Add a stable transition action representation for the workflow matrix.
- Add `action`, `actorRole`, and `requestSource` storage to
  `ComplaintStatusHistory` with snake_case column mapping.
- Keep existing F0-08 complaint tables and relationships intact.
- Migration must be safe for the current seeded database and must not mutate audit
  log append-only protections.

## Acceptance Criteria

- Prisma schema validates.
- Migration applies inside the Docker network using the existing F1-00A pattern.
- Schema guard tests fail if the transition-history metadata fields are removed.
- No application behavior is implemented.

## Verification Commands

Run and label honestly:

- `corepack pnpm lint`
- `corepack pnpm --dir packages/database exec prisma validate --schema prisma/schema.prisma`
- `corepack pnpm --dir packages/database exec prisma generate --schema prisma/schema.prisma`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm openapi:check`
- `docker compose up -d postgres`
- `docker run --rm --network cms-forge_default -v "${PWD}:/workspace:ro" -w /workspace -e DATABASE_URL="postgresql://cms_auto:cms_auto_dev@postgres:5432/cms_auto?schema=public" node:20-bookworm-slim sh -lc "apt-get update >/dev/null && apt-get install -y openssl >/dev/null && npm exec --yes prisma@5.22.0 -- migrate deploy --schema packages/database/prisma/schema.prisma"`

Do not claim `db:migrate:test` passed; it is still a fail-loud placeholder unless
this task replaces it with a real proof.

## Requirement IDs

- ARCH-DATA-001
- ARCH-WORKFLOW-001
- WORKFLOW-MATRIX-001
- METHOD-AUDIT-001
- API-STANDARD-001
- REQ-COMPLAINT-001
- METHOD-TEST-001

## Security Self-Check To Record In Evidence

- Roles and branch scope from server session: Not Run expected; migration-only
  task has no authenticated request boundary.
- State history and audit in same transaction: Not Run expected; this task adds
  storage only. F2-02B must prove it with service behavior and is a Verify Gate.
- No passwords, OTPs, tokens, hashes, or provider secrets logged or returned:
  Passed by scope if the migration contains no secret data and no logging.
- Portal exposure rules: Not Run expected; no portal API is implemented.
- Trust boundaries tested: Not Run expected unless this task adds a real request
  boundary, which it should not.
