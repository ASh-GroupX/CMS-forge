# Current State

Status: Ready to Build
Phase: Phase 8 - Operational Completion (pre-pilot blockers)
Next Task: F8-02 - Drive SLA warning/breach jobs from the BullMQ worker
Model Tier: BUILDER-STRONG

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Phases 0-7 accepted; MVP backlog complete, all gates green, coverage ~90%.
- Phase 8 is active because async jobs existed but had no runtime driver.
- DONE: F8-00 job-runtime gate. `lint` fails on undriven background jobs, with 6
  current jobs grandfathered in a shrink-only ratchet.
- DONE: F8-01 BullMQ runner foundation. Worker boots a Nest application context,
  connects to Redis for `sla`, `notifications`, and `attachments-scan`, and
  processed Docker smoke job `f8-01-smoke-1781934277758`.
- NEXT: F8-02 drives `SlaService.runWarningJob` and `runBreachJob` from the
  worker and removes those two entries from the ratchet after executed proof.
- THEN: F8-03 notification dispatch, F8-04 attachment scan, F8-05 S3 storage,
  F8-06 end-to-end smoke, F8-07 remove default-parameter DI fallbacks.

## Note on verification

F8-02+ require executed Docker proof. Do not mark them done on typecheck/lint
alone.

## Open carry-forward / known debt

- job-runtime ratchet is still 6 and must reach empty by end of Phase 8.
- Attachment storage in-memory; not durable (F8-05).
- Default-parameter DI fallbacks mask missing providers (F8-07).
