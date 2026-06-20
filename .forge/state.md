# Current State

Status: Ready to Build
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Next Task: P10-09A Participant ACL and confidentiality service enforcement
Model Tier: BUILDER-STRONG

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Done in Phase 10 no-stack track: P10-01A/B/C, P10-02A, P10-03A,
  P10-04A/B/C, P10-05A/B, P10-06A/B/C, P10-07A, P10-08A/B.
- P10-08B proof passed locally: focused cases service test, typecheck, OpenAPI
  check, lint, root tests, and diff whitespace check.
- Next build is P10-09A, a Critical-risk confidential employee-case privacy
  slice for participant ACL, accused default denial, conflict-of-interest guard,
  denial audit, and focused allowed/denied tests.
- Deferred to stack repair `[stack]`: P10-01D, P10-02B, P10-03B, P10-04D,
  P10-07B, P10-09C, P10-10B (P10-10A seed is buildable after the ACL slice if
  no more no-stack backend prerequisites are needed).

## Local prerequisite (HUMAN - gates the [stack] tasks only)

Local stack down: Docker, Redis :6379, Postgres dev creds, critically low C:
disk. Free disk + start Docker + fix DB creds before the `[stack]` batch. The
no-stack backend track does NOT need it.

## Open carry-forward / known debt

- Case/CAPA schema migrations are not live-applied until the local stack is
  fixed.
- C: remains critically low on free space; avoid unnecessary generated artifacts.
- Production deploy parked. SMS/WhatsApp/DMS mocked. Runtime DB migration apply
  + live task/deal/case API proof are Not Run until the stack is fixed.
