# Current State

Status: Ready to Build
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Next Task: P10-07A1 Task/promise KPI formulas from task events
Model Tier: BUILDER-STRONG

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Done in Phase 10 no-stack track: P10-01A/B/C, P10-02A, P10-03A,
  P10-04A/B/C, P10-05A/B, P10-06A/B/C.
- P10-06C proof passed locally: workflow API suite, focused cases tests,
  OpenAPI check, lint, typecheck, root tests, and diff whitespace check.
- P10-07A has been split into no-stack backend slices: task/promise KPI formulas,
  task KPI service wiring, complaint/case KPI formulas, and KPI HTTP/OpenAPI/RBAC
  proof.
- Deferred to stack repair `[stack]`: P10-01D, P10-02B, P10-03B, P10-04D,
  P10-07B, P10-09C, P10-10B (P10-10A seed is buildable after the KPI/CAPA/ACL
  no-stack track).

## Local prerequisite (HUMAN - gates the [stack] tasks only)

Local stack down: Docker, Redis :6379, Postgres dev creds, critically low C:
disk. Free disk + start Docker + fix DB creds before the `[stack]` batch. The
no-stack backend track does NOT need it.

## Open carry-forward / known debt

- Next build is P10-07A1, a pure reports-side task/promise KPI helper derived
  from task rows and status-history events.
- Case schema migrations are not live-applied until the local stack is fixed.
- C: remains critically low on free space, about 142 MB free after P10-06C
  proof; generated `.next` and `cms-auto-*` temp dirs were cleared during Phase
  10 to let coverage reporting complete.
- Production deploy parked. SMS/WhatsApp/DMS mocked. Runtime DB migration apply
  + live task/deal/case API proof are Not Run until the stack is fixed.
