# Current State

Status: Ready to Build
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Next Task: P10-03C - Digest and manager rollup notification batching
Model Tier: BUILDER-STRONG

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Local stack is usable for Phase 10 `[stack]` tasks.
- Docker Desktop is reachable.
- Project Postgres and Redis are running under compose project
  `cms-forge-local`.
- Host-side database URL is
  `postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto` because Windows
  PostgreSQL still owns host port 5432.
- Host-side Redis URL is `redis://localhost:6379`.
- Prisma migrations are applied and `corepack pnpm db:seed` passes.
- API is healthy at `http://localhost:3000/health`.
- Web is running at `http://localhost:4000`.
- P10-01D is complete: `/tasks/today` renders Employee Today from the real API.
- P10-02B is complete: `/tasks/manager` renders Manager Control Room from the
  real `GET /tasks/manager-rollup` API, with runtime proof saved at
  `output/playwright/manager-control-room.png`.
- P10-03B is complete: the Phase-8 BullMQ worker schedules
  `tasks.escalation.scan` and queues idempotent in-app escalation notifications
  through the backend notification service.

## Open carry-forward / known debt

- Phase 10 is not complete. The next unfinished local-first task is P10-03C:
  define and wire the digest/rollup notification batching contract.
- Daily employee digest and manager rollup batching were intentionally split out
  from P10-03B because existing notification primitives only support
  single-recipient event notifications.
- Windows service `postgresql-x64-16` still owns host port 5432; keep using 5433
  for this local Docker database unless the service is stopped with admin rights.
- Production deploy remains parked. SMS/WhatsApp/DMS remain mocked.
