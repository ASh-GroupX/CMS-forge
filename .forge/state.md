# Current State

Status: Ready to Build
Phase: Phase 8 - Operational Completion (pre-pilot blockers)
Next Task: F8-01 - Background runner foundation (BullMQ worker entrypoint, no job logic)
Model Tier: BUILDER-STRONG

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Phases 0-7 accepted; MVP backlog complete, all gates green, coverage ~90%.
- Systemic gap found in final review: the async layer (SLA jobs, notification
  dispatch, attachment scan, survey scheduling) is built/unit-tested but has NO
  runtime driver; attachment storage is in-memory only.
- Phase 8 makes it actually run. DoD = executed end-to-end proof, not green.
- DONE: F8-00 job-runtime gate (FORGE-JOB-RUNTIME-001) - lint fails on any undriven
  background job; 6 current jobs grandfathered in a shrink-only ratchet
  (tools/job-runtime-check.mjs). Verified lint pass, test 46/46.
- PLANNED: F8-01 (this task) - BullMQ runner foundation. Runner = BullMQ on Redis
  (user decision). Foundation only: worker entrypoint that boots DI + connects to
  Redis + noop processor; NO job logic yet.
- THEN: F8-02..04 drive SLA/notifications/scan (remove each from the ratchet with
  e2e proof), F8-05 real S3 adapter, F8-06 e2e smoke, F8-07 remove default-param DI.

## Note on verification

F8-01+ are integration tasks. Their L4 proof (worker boots, connects to Redis,
processes a job) requires the running Docker stack - it cannot be proven by
typecheck/lint alone, and must not be marked done on static green.

## Open carry-forward / known debt

- job-runtime ratchet (6 jobs) in tools/job-runtime-check.mjs must reach EMPTY by
  end of Phase 8.
- Attachment storage in-memory; not durable (F8-05).
- Default-parameter DI fallbacks mask missing providers (F8-07).