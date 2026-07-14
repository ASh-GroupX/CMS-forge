# Current State

Status: CMSS Kanban revamp — PHASE A COMPLETE (A1–A8): Trello task board shipped end-to-end with proofs
Phase: CMSS Trello-style board revamp — Phase B next (ticket board, admin stages, dept assignment)
Next Task: B1 — board-stages CRUD module (copy golden branches module); seed TICKETS stages
Model Tier: Opus 4.8 Max or GPT-5.5 Extra High

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- SSOT: `docs/CMSS_REVAMP_PLAN.md` (checklist, locked decisions). T0 + A1–A4 done.
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

- A4 shipped: `@dnd-kit/core@6.3.1` + `@dnd-kit/sortable@10.0.0` +
  `@dnd-kit/utilities@3.2.2` in `apps/web`; shadcn CLI generated
  `avatar/tooltip/sheet/scroll-area/popover` in `src/components/ui/`; board
  tokens (`--board-column-bg/--board-card-bg/--board-drop-bg/--board-drop-ring/
  --board-drag-shadow`, `--stage-{slate,blue,amber,green,red,violet}[-bg]` +
  dark overrides) in `globals.css`, mapped as `board.*`/`stage.*` colors +
  `shadow-drag` in `tailwind.config.ts`, mirrored in `lib/tokens.ts`.
  lint + full typecheck + 35/35 tasks tests re-verified Passed.
  Note: shadcn CLI needs pnpm on PATH — corepack shim created at scratchpad
  `corepack-shims/` (`corepack enable --install-directory`).
  Note: on fresh Windows checkouts (`core.autocrlf=true`) `openapi:check` fails
  on CRLF — run `corepack pnpm openapi:generate` once to rewrite LF (no diff).

- A5 shipped: `apps/web/src/lib/staff-board-api.ts` (220 lines) —
  `getTaskBoardLoadResult` (GET /tasks/board, ready/denied/error union) +
  `moveTaskCard` (POST /tasks/:id/move with CSRF header; result union
  success{card}/invalid{fields}/denied/not_found/error — `invalid` carries the
  400 VALIDATION_FAILED field list so A6 can open the status-note dialog);
  `apps/web/src/app/(staff)/tasks/board/actions.ts` `moveTaskCardAction`
  ('use server', revalidatePath on success);
  `apps/web/test/api-client/staff-board-api.test.ts` (4 tests: scoped GET,
  denied/error/malformed, CSRF POST body, outcome mapping).
  213/213 `test:web`, lint, web typecheck Passed.

- A6 shipped: `/tasks/board` Kanban — `components/task-board/{index,board-card,
  board-column,board-loading}.tsx`, `(staff)/tasks/board/{page,loading}.tsx`,
  `i18n/staff-task-board.ts`, nav 'board' (app-shell + staff-shell + layout
  role lists). dnd-kit island: optimistic cross-column move + snapshot
  rollback, DragOverlay tilt, drop highlight, status-note dialog on 400,
  sonner toasts, keyboard sensors + SR announcements, all states, en+ar RTL.
  Proof harness: `/tasks/board` fixture + `staff-board` route + en/ar visual
  cases (102 previews Passed); screenshots self-reviewed + sent to user.
  lint / web tsc / test:web 213/213 / i18n-lint Passed.

- A7 shipped: mobile Board/List switcher (min-h-11, aria-pressed, lg:hidden),
  list layout stacks full-width columns; en 390px + ar 390–1440px visual cases.
- A8 shipped: en+ar board accessibility cases (axe) — fixed sortable
  role=button on `<li>` and 3 contrast issues; `tools/task-board-dnd-proof.mjs`
  (`test:e2e -- task-board-dnd`) — real Chromium pointer drag over the
  hydrated island asserting DOM move + committed payload + toast.

## Current Stop

PHASE A COMPLETE. All proofs Passed: lint, typecheck, test:web 213/213,
test:api tasks 35/35, test:visual 108, accessibility 24, task-board-dnd,
openapi:check, i18n-lint. Not Run: live DB (`db:push`/`db:seed`) and drag
against a live API — no local DATABASE_URL.
A4–A8 are uncommitted in the working tree (A1–A3 committed in d85d76e).
Next: Phase B per the SSOT — B1 `board-stages` CRUD module (copy `branches`
golden module; ADMIN-manage/staff-read RBAC; seed TICKETS stages mapped to
ComplaintStatus), then B2 admin stage UI, B3 task department assignment,
B4/B5 the complaints board, B6 card detail drawer; Phase C final proofs.

## Open Carry-Forward / Known Debt

- A2 board card DTO intentionally omits `displayTimeZone` (branch tz) and
  `BoardStageDto` omits `isDefault`, matching the handover field list. If A6's
  card design shows an absolute due time (not relative), add `displayTimeZone`
  to the board select + `BoardCardDto` before A5 generates the typed client.
- A3–A8 of Phase A, then Phases B/C per SSOT.
- Deploy secrets + `production` branch + production smoke (human gates).
