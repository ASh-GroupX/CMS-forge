# Build Task: F8-01 - Background Runner Foundation (BullMQ)

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High (new runtime process + infra dependency; deployment topology change)
Phase: Phase 8 - Operational Completion

## Decision (resolved by user)

Runner = BullMQ on the existing Redis. Redis is already in docker-compose and
REDIS_URL is configured. The worker is a SECOND deployable process beside the API.

## Scope - foundation ONLY (no job business logic)

Keep to ~1-5 files + tests. This task only stands up the runner skeleton; F8-02..04
wire the actual SLA / notification / scan jobs and remove them from the ratchet.

Target files:
- apps/api/package.json - add `bullmq` dependency.
- apps/api/src/worker/queue.ts - BullMQ connection from REDIS_URL + named queue
  registry (sla, notifications, attachments-scan) + a typed enqueue helper. No
  business logic, no domain service calls.
- apps/api/src/worker/index.ts - worker entrypoint: boot a Nest application CONTEXT
  (DI graph, no HTTP listener), start a BullMQ Worker bound to the queues with a noop
  processor that logs received jobs, plus graceful shutdown. Mirrors src/main.ts
  bootstrap but for the worker.
- docker-compose.yml - add a `worker` service running the entrypoint against the same
  Postgres/Redis (or document the exact run command).
- apps/api/test/worker/queue.test.ts - unit-test the queue registry / enqueue helper
  with a fake connection (no live Redis).

## Acceptance criteria

- AC1 [must] `corepack pnpm typecheck` and `corepack pnpm lint` pass (worker is
  api-boundary code; boundary lint applies; keep the 300-line budget).
- AC2 [must] Unit test covers the queue registry / enqueue helper without live Redis.
- AC3 [must] EXECUTED proof on the Docker stack: bring up redis + worker, the worker
  connects to Redis, and an enqueued test job is received by the noop processor
  (capture the log). This is the phase L4 gate - do NOT mark done on typecheck/lint alone.
- AC4 [must] No job business logic and no changes to existing services; the
  job-runtime ratchet stays at 6 (untouched) this task.
- AC5 [must] Connection comes from env (REDIS_URL); no hardcoded secrets.

## Proof commands

- corepack pnpm typecheck
- corepack pnpm lint
- corepack pnpm test
- docker compose up -d redis worker   # then assert worker log: queue connected + test job received

## Guardrails

- Worker may import core/* and module public services only - never another module's
  repository/dto/prisma (boundary lint enforces this).
- Idempotency and the real job calls are F8-02..04, not here.
- Update evidence/trust; REPLACE state.md (do not append).