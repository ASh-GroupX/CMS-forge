# Current State

Status: Universal assignment/forwarding implementation complete on isolated
branch `nour` (not merged into a protected branch).
Phase: A–E complete.
Next Task: Human review, then optional commit/push/PR.
Model Tier: GPT-5.5 Extra High or equivalent.

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- `nour` was created from clean commit `e7435c0` after `git fetch`; source branch
  `feat/cmss-task-board` matched its remote at the branch point (0 ahead/behind).
- Added generic current assignment + append-only forwarding history, additive
  compatibility columns, and idempotent backfill migration.
- Generated and registered the reusable assignments module with scoped options,
  target validation, transactional history/audit, and after-commit delivery.
- Tasks/Promises, Complaints, Deals/Leads, and Cases/Requests dual-write their
  legacy fields and the generic assignment in the owning domain transaction.
- Reusable EN/AR assignment picker is integrated into task, complaint, deal,
  and confidential case forms; user, department, and combined targets work.
- Read models, search/report filters, dashboard ownership, notifications, and
  nullable department-only compatibility were updated without removing legacy
  APIs or fields.
- OpenAPI and generated contract are current. Visual and accessibility proofs
  passed and EN/AR screenshots were inspected.
- Full proof matrix is recorded in `.forge/evidence.md`.

## Security focus

- Actor role/branch/department scope comes only from the server session.
- Domain modules retain record/workflow authorization.
- Generic assignment validates active targets and branch compatibility.
- Assignment/history/audit writes commit atomically; notifications enqueue
  after commit.
- Portal APIs never expose assignment history or staff directory details.

## Deployment handoff

1. Back up the target database.
2. Run `corepack pnpm --dir packages/database exec prisma migrate deploy --schema prisma/schema.prisma`.
3. Regenerate/deploy the application packages normally.
4. Verify assignment options and one user-, department-, and combined-target
   assignment per adopted domain.

Rollback should roll application code forward to a repair build while retaining
the additive tables. Do not drop generic tables if department-only rows exist;
legacy columns remain available because no destructive removal was performed.
