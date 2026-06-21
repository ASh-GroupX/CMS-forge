# Current State

Status: Ready to Plan
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Next Task: P10-10B - End-to-end local Phase 10 proof split
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
- Prisma migrations are applied and `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm db:seed` passes.
- API is not left running by the latest proof cleanup; start it with
  `PORT=3000` and the host-side database URL when needed.
- Web is running at `http://localhost:4000`.
- P10-09 is complete: the authenticated confidential case timeline route and
  staff screen both delegate restricted-note visibility to backend
  actor-scoped ACLs, with local screenshot proof.

## Open carry-forward / known debt

- Phase 10 is not complete. The next task is to split P10-10B into buildable
  local end-to-end proof tasks before implementation.
- The current role model has no explicit HR role; confidential staff access uses
  backend participant ACL plus existing manager/admin-capable staff surfaces.
- Manager rollup batching currently queues one internal manager-scope in-app row
  with no single user recipient; explicit manager user expansion remains
  deferred until a user-directory recipient contract exists.
- Windows service `postgresql-x64-16` still owns host port 5432; keep using 5433
  for this local Docker database unless the service is stopped with admin rights.
- Production deploy remains parked. SMS/WhatsApp/DMS remain mocked.
