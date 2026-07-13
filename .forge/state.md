# Current State

Status: CMSS Kanban revamp Phase A started; A1 (schema + seed) complete
Phase: CMSS Trello-style board revamp — Phase A (task board drag & drop)
Next Task: A2 — GET /tasks/board session-scoped endpoint + tests
Model Tier: Opus 4.8 Max or GPT-5.5 Extra High

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- SSOT: `docs/CMSS_REVAMP_PLAN.md` (checklist, locked decisions). T0 + A1 done.
- A1 shipped: `BoardStage` model + `BoardScope` enum + `Task.stageId?` +
  `Task.boardPosition` in `packages/database/prisma/schema.prisma`;
  idempotent default TASKS stages seed in
  `packages/database/prisma/board-stages-seed.ts` (wired into `seed.ts`).
- A1 proofs: prisma validate + generate Passed; repo lint + typecheck Passed;
  `db:push`/`db:seed` Not Run (no local DATABASE_URL in this environment).
- Uncommitted working-tree changes: schema, seed files, docs/CMSS_REVAMP_PLAN.md,
  .forge chain files (plus pre-existing unrelated modifications:
  packages/contracts/openapi.json, tools/lint.mjs, tools/web-proof.test.mjs).

## Current Stop

Handover requested by user mid-Phase A. A2 design is settled (see
docs/CMSS_REVAMP_PLAN.md + next.md): new `tasks.board.repository.ts` +
`tasks.board.service.ts` + `dto/board.dto.ts` because `tasks.service.ts`
(300 lines) and `tasks.repository.ts` (281 lines) are at/near the 300-line
budget — do NOT extend them.

## Open Carry-Forward / Known Debt

- A2–A8 of Phase A, then Phases B/C per SSOT.
- Deploy secrets + `production` branch + production smoke (human gates).
