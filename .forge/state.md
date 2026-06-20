# Current State

Status: Ready to Build
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Next Task: P10-01A - Task domain model + next-action invariant (unit-provable, no full stack)
Model Tier: BUILDER-STRONG

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Phase 10 (full) is planned in backlog.md: P10-01..P10-10 + P10-OPS, scope frozen
  (Task/Case/Deal only; no AI/BPMN/mobile/WhatsApp/HR-platform; production deferred).
- Refinements baked in: next-action invariant lives INSIDE the Task atom (the spine,
  not a later bolt-on); links[] polymorphic from the start; 10-second quick-add is a
  P10-01 requirement; P10-01/04/06/09 are umbrellas that PLAN-split before build.
- Building local-first. Logic-heavy foundation (Task model + invariant + KPI queries)
  is unit-provable WITHOUT the running stack; runtime proofs (escalation jobs P10-03,
  deal handoff P10-04, UAT demo P10-10) block until the stack is up.
- NOW: P10-01A builds the Task model + next-action invariant + service tests - no
  stack needed, so it proceeds while the environment is fixed.

## Local prerequisite (HUMAN - gates runtime proofs, not P10-01A)

The local stack is down: Docker daemon, Redis :6379, Postgres dev creds, and
critically low C: free space. Free disk + start Docker + fix DB creds before tasks
that need runtime/web proof (P10-01C/D screens, P10-03 jobs, P10-04 deal, P10-10 UAT).

## Open carry-forward / known debt

- Production deploy parked. SMS/WhatsApp/DMS mocked. Badge enum localization folds
  into the P10 Employee Today / Control Room UI.