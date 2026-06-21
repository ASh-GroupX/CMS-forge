# Build Task: P10-03C - Digest And Manager Rollup Notification Batching

Status: Ready to Build
Required model tier: BUILDER-STRONG
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Risk: High

## Context

P10-03B is complete: the Phase-8 BullMQ notifications worker schedules
`tasks.escalation.scan` and queues idempotent in-app escalation notifications.
That slice intentionally did not add daily employee digest or manager-rollup
batching because the existing notification primitive is single recipient/event
oriented and has no digest window or grouping contract yet.

Current local stack:

- Docker compose project: `cms-forge-local`
- Postgres container: `cms-forge-local-postgres-1`
- Redis container: `cms-forge-local-redis-1`
- Host `DATABASE_URL`: `postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto`
- Host `REDIS_URL`: `redis://localhost:6379`
- API: `http://localhost:3000`
- Web: `http://localhost:4000`

## Scope

Add the smallest backend-owned digest/rollup notification contract:

1. Define a deterministic daily digest window key, recipient selection, and
   payload shape for employee task digests.
2. Define a deterministic manager rollup batching key, recipient selection, and
   payload shape for manager-facing escalation rollups.
3. Wire the Phase-8 worker to enqueue those digest/rollup notifications
   idempotently using the existing notification service.
4. Reuse existing Employee Today / Manager Control Room read models where they
   fit; do not duplicate task query logic in the worker.
5. Add focused tests for one employee digest, one manager rollup, idempotent
   rerun behavior, and no role/branch authority from worker payload.

## Guardrails

- Do not add a new scheduler framework, workflow builder, AI, WhatsApp, mobile
  app, or new notification provider.
- Do not move workflow authority into React or the worker; the backend task
  service/read models remain authoritative.
- Keep notifications internal/in-app unless an existing provider path is already
  required by the service contract.
- Keep the task to 1-5 files plus focused tests. If it grows, stop and replan.
- High risk: record the policy security self-check in evidence before counting
  the task successful.

## Acceptance

- Worker/runtime can enqueue daily employee digest and manager rollup
  notifications from backend-owned read models.
- Repeat runs for the same digest/rollup window do not duplicate notifications.
- Staff cannot gain manager rollup scope through worker job input.
- Proof covers one digest, one manager rollup, and one duplicate suppression
  path.
- Evidence records exactly what ran.

## Proof Commands

- `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm db:seed`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test:api -- tasks`
- `corepack pnpm test:api -- notifications`
- `corepack pnpm test`
- Local worker/runtime smoke against Redis if available
