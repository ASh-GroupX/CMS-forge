# Current State

Status: Ready to Build
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Next Task: P10-01D - Employee Today screen and runtime proof
Model Tier: BUILDER-STRONG

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Local stack blocker repaired enough to resume Phase 10 `[stack]` tasks.
- C: free space was raised from under 100 MB to about 21 GB by clearing generated
  caches only.
- Docker Desktop was restarted and the engine is reachable.
- Project Postgres and Redis are running under compose project `cms-forge-local`.
- Host-side database URL is
  `postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto` because Windows
  PostgreSQL still owns host port 5432.
- Prisma migrations are applied and `corepack pnpm db:seed` now passes.
- API is healthy at `http://localhost:3000/health`.
- Web is running at `http://localhost:4000`.

## Open carry-forward / known debt

- Windows service `postgresql-x64-16` still owns host port 5432; keep using 5433
  for this local Docker database unless the service is stopped with admin rights.
- Production deploy remains parked. SMS/WhatsApp/DMS remain mocked.
