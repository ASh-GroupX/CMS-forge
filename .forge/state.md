# Current State

Status: CMSS Kanban revamp Phase A; A1 (schema) + A2 (board read) + A3 (move) complete — backend done
Phase: CMSS Trello-style board revamp — Phase A (task board drag & drop)
Next Task: A4 — install @dnd-kit/core + @dnd-kit/sortable; add shadcn primitives (avatar, tooltip, sheet, scroll-area, popover); board design tokens
Model Tier: Opus 4.8 Max or GPT-5.5 Extra High

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- SSOT: `docs/CMSS_REVAMP_PLAN.md` (checklist, locked decisions). T0 + A1 + A2 done.
- A1 shipped: `BoardStage` model + `BoardScope` enum + `Task.stageId?` +
  `Task.boardPosition` in `packages/database/prisma/schema.prisma`;
  idempotent default TASKS stages seed in
  `packages/database/prisma/board-stages-seed.ts` (wired into `seed.ts`).
- A2 shipped: `GET /tasks/board` session-scoped Kanban read (`tasks.board.repository.ts`
  `listStages`/`listBoardTasks`, `tasks.board.service.ts` `board` + pure
  `buildTaskBoard`, `dto/board.dto.ts`, `test/tasks/board.test.ts`). Documented in
  OpenAPI. `board_stages` declared in tasks MODULE.md.
- A3 shipped: `POST /tasks/:id/move`. `tasks.board.repository.ts` `findStage`/`moveTask`;
  `TasksBoardService.move` (same-tx: findById → assertCanAct → stage validate → derive
  status → PATCH-shared note/next-action invariants incl. `assertAssignable` branch-scope
  guard on nextAction.whoId → moveTask + history + statusComment + audit 'task_moved');
  `dto/move-task.dto.ts`; `dto/board.dto.ts` `MoveTaskResponseDto`;
  `test/tasks/board-move.test.ts` (11 tests). Controller `@Post(':id/move')` (Session+
  Permission+Csrf); provider injects TasksRepository+AuditService+AdminUsersService.
  `assertNextAction`/`normalizeNextAction` exported from `tasks.service.ts` (no line
  growth); `stageId` added to `taskSelect` (repo 281). `POST /tasks/{id}/move` in OpenAPI.
- A2+A3 proofs: `test:api -- tasks` 35/35, lint, typecheck, openapi:generate+check Passed;
  live DB Not Run (no local DATABASE_URL). Tools `test` 58/59 — the 1 failure is the
  pre-existing web visual-proof (Playwright) harness, unrelated to backend. Evidence in
  `.forge/evidence.md` (A2 + A3 sections).
- Uncommitted working-tree changes: schema + seed (A1); A2/A3 backend files
  (`tasks.board.*`, `dto/board.dto.ts`, `dto/move-task.dto.ts`, controller/module/
  MODULE.md/service/repository edits, `test/tasks/board*.test.ts`); OpenAPI canonical +
  committed; docs/CMSS_REVAMP_PLAN.md; .forge chain files (plus pre-existing unrelated
  modifications: tools/lint.mjs, tools/web-proof.test.mjs).

## Current Stop

Phase A backend (A2 read + A3 move) complete and verified. Next is A4 (frontend
groundwork): add `@dnd-kit/core` + `@dnd-kit/sortable`; generate the shadcn
primitives the board needs (avatar, tooltip, sheet, scroll-area, popover) via the
shadcn CLI; add board design tokens. Then A5 typed client + move server action,
A6 the `/tasks/board` Kanban page, A7 mobile, A8 visual/a11y/e2e proofs.

## Open Carry-Forward / Known Debt

- A2 board card DTO intentionally omits `displayTimeZone` (branch tz) and
  `BoardStageDto` omits `isDefault`, matching the handover field list. If A6's
  card design shows an absolute due time (not relative), add `displayTimeZone`
  to the board select + `BoardCardDto` before A5 generates the typed client.
- A3–A8 of Phase A, then Phases B/C per SSOT.
- Deploy secrets + `production` branch + production smoke (human gates).
