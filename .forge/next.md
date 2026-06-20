# Build Task: F8-02 - Drive SLA Jobs From Worker

Status: Ready to Build
Required model tier: BUILDER-STRONG
Risk: High (SLA workflow runtime + escalation notification path)
Phase: Phase 8 - Operational Completion

## Scope

Wire only the SLA queue. Do not touch notification dispatch or attachment scan
yet.

Target files:
- `apps/api/src/worker/index.ts` - replace the `sla` noop path with calls to the
  public `SlaService.runWarningJob(new Date())` and
  `SlaService.runBreachJob(new Date())` for explicit SLA job names. Keep
  `notifications` and `attachments-scan` noop.
- `apps/api/src/worker/queue.ts` - only if a tiny helper is needed for repeatable
  SLA enqueueing.
- `tools/job-runtime-check.mjs` - remove `runWarningJob` and `runBreachJob` from
  `knownUndrivenJobs` after the worker actually calls them.
- `apps/api/test/worker/sla-runner.test.ts` - focused unit proof with a fake
  `SlaService`; no live Redis.

## Acceptance criteria

- AC1 [must] Worker invokes only the public `SlaService`; no repository, DTO,
  Prisma, or cross-module private imports.
- AC2 [must] Warning and breach jobs are idempotent by using the existing
  `SlaService` methods; no duplicate event logic is reimplemented in the worker.
- AC3 [must] `tools/job-runtime-check.mjs` ratchet shrinks from 6 to 4.
- AC4 [must] Unit proof covers both warning and breach worker dispatch with fake
  service dependencies.
- AC5 [must] EXECUTED Docker proof: worker processes SLA warning and breach jobs
  against the stack; a seeded overdue complaint creates a warning, then a breach
  and internal escalation notification.

## Proof commands

- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test`
- `node --import tsx --test apps/api/test/worker/sla-runner.test.ts`
- `docker compose up -d redis worker`
- Docker proof command(s) to enqueue SLA warning/breach smoke jobs and capture
  worker logs plus resulting warning/breach/notification records.

## Guardrails

- No notification dispatch draining; that is F8-03.
- No attachment scan state transition driver; that is F8-04.
- Do not mark done without Docker proof. If seeded DB proof cannot stay small,
  stop and replan F8-02 instead of making a large diff.
- Update evidence/trust; REPLACE state.md (do not append).
