# Next Task: PLAN-F2-01 - Plan Complaint Core And Scope The Complaint Schema/Migration

Status: Ready to Plan
Required model tier: PLANNER
Risk: High
Phase: Phase 2 - Complaint Core

## Why This Exists

Phase 1 (Security Baseline) is accepted (see `.forge/trust.md` PHASE-1-REVIEW). Phase 2
backlog items `F2-01..F2-04` are broad headers, not agentic 1–5 file tasks, and Phase 2
contains the most architecturally significant requirement in the MVP — the **backend-owned
complaint state machine** (a non-negotiable: React never decides complaint state). It also
overlaps a subtlety: the F0-08 data model already drafted the complaint tables and `F1-00A`
**already generated and applied** that migration, so the complaint tables physically exist.
This planner pass reconciles what already exists against what Phase 2 needs and emits the
first small buildable task — it does not implement.

## Inputs To Read

- `.forge/backlog.md` (Phase 2 headers), `.forge/evidence.md` (F0-08, F1-00A, F1-05* golden CRUD)
- `packages/database/prisma/schema.prisma` + applied migration `…_f0_08_core_model`
- `docs/CMS_AUTO_SRS.md`: `REQ-COMPLAINT-001`, `ARCH-WORKFLOW-001`, `WORKFLOW-MATRIX-001`,
  `ARCH-DATA-001`, `API-STANDARD-001`, `METHOD-AUDIT-001` (cite only the IDs the tasks need)
- `docs/ARCHITECTURE.md` §6 canonical patterns; the frozen golden CRUD `branches` module
- `CLAUDE.md` / `AGENTS.md`

## What To Decide

1. **Schema reconciliation.** Diff the complaint-core slice the F0-08 schema already applied
   (`complaints`, `complaint_status_history`, `comments`, `attachments`, `approvals`, SLA
   tables, etc.) against what `REQ-COMPLAINT-001` + `WORKFLOW-MATRIX-001` require. List any
   deltas. If no schema change is needed, say so explicitly and make `F2-01` a complaint
   module shell/repository foundation task instead of a migration task.
2. **Phase 2 task split.** Break `F2-01..F2-04` into ordered agentic build tasks (each ~1–5
   files + tests, generated from the module template / copied from golden `branches`). Keep
   the backend state machine its own task(s); mark the state-machine kernel
   `Verify Gate: required` (dependents build on it), per Phase 1 precedent.
3. **First task only.** Queue exactly one buildable task in `.forge/next.md` (the smallest
   correct first step — schema delta + migration, or the complaint module read foundation),
   with exact verification commands, cited SRS IDs, and the High-risk security self-check.

## Output (planner)

- Replace `.forge/next.md` with the first buildable Phase 2 task; set `.forge/state.md` to
  `Ready to Build`.
- Represent the Phase 2 split in `.forge/backlog.md` (sub-items under `F2-01..F2-04`),
  marking the state-machine kernel `Verify Gate: required`.
- Append a planning evidence entry to `.forge/evidence.md`; do not change application source.
- Do not weaken the non-negotiables: backend owns workflow authority; every complaint state
  change writes status history **and** an audit entry in the same transaction; side effects
  enqueue after commit.

## Carry-In From PHASE-1-REVIEW (address opportunistically in early Phase 2)

- Consider a shared `@Global()` core module for `PrismaService`/`AuditService` before more
  modules each spin up their own (condition 4).
- Add a small Nest bootstrap/e2e smoke test as complaint mutation routes appear (condition 3).
