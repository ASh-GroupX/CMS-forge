# HANDOVER — CMSS Trello-Style Revamp (repo: D:\work\CMS-forge)

You are continuing an approved, in-progress effort. Planning and investigation
are DONE, decisions are LOCKED, and tasks T0 + A1 are already implemented.
Read `docs/CMSS_REVAMP_PLAN.md` (the SSOT) and `.forge/state.md` first, then
start executing at task **A2**.

## Ground rules (binding — from CLAUDE.md / .forge/policy.md)

- Backend (NestJS, `apps/api`) owns ALL workflow authority. React never decides
  state. Roles/branch scope come from the server session only.
- Every state change writes status history + audit in the SAME transaction
  (repository `transaction(client => …)` + `auditService.record(…, client)`);
  side effects after commit. Audit is append-only; never log secrets.
- Small tasks: ~1–5 files + tests; source files < 300 lines (tests, DTOs,
  schema.prisma, OpenAPI, migrations, generated, docs exempt). Replan if bigger.
- UI: shadcn/ui CLI only, design tokens only, en+ar strings (RTL via logical
  properties), loading/empty/error/denied/conflict states, render + screenshot
  + self-review before "done".
- After EVERY task: mark `[x]` in `docs/CMSS_REVAMP_PLAN.md`, summarize, update
  `.forge/next.md` + `.forge/state.md`, evidence + SRS IDs in `.forge/evidence.md`
  (SRS IDs: REQ-RBAC-001, UI-SCREEN-001, UI-DESIGN-001, REQ-LOCALIZATION-001,
  METHOD-TEST-001).
- Verification labels: Passed / Failed / Not Run / Assumed / Needs Human Review.
  Never claim an unrun check.

## Goal & priority

Trello-like Kanban revamp of staff Tasks + Tickets: drag-and-drop boards,
dynamic stages, department/staff assignment, strict privacy scoping,
days-active metrics, threaded card updates. **User priority: the drag-and-drop
TASK board UI/UX ships first (Phase A end-to-end).**

## Locked decisions (do not re-ask)

1. Ticket stages = mapped columns: ticket board columns are admin-configurable
   but each maps to an existing `ComplaintStatus`; drags fire the real
   `POST /complaints/:id/transitions`; illegal targets greyed out. Never bypass
   the complaint state machine.
2. Boards ship ALONGSIDE existing screens (new primary nav entries; old screens stay).
3. DnD: `@dnd-kit/core` + `@dnd-kit/sortable` (not yet installed).
4. No new state library: RSC page loader + `'use client'` board island +
   server actions + `useOptimistic` rollback.

## Already DONE (do not redo)

- **T0**: `docs/CMSS_REVAMP_PLAN.md` created (full current-state analysis,
  decisions, checklist). `.forge/next.md` + `state.md` updated.
- **A1**: In `packages/database/prisma/schema.prisma`: `BoardScope` enum
  (TASKS|TICKETS), `BoardStage` model (`code @unique`, scope, nameEn, nameAr,
  color, position, isDefault, mappedTaskStatus?, mappedComplaintStatus?,
  archivedAt?, timestamps, `tasks Task[]`, `@@index([scope, position])`,
  `@@map("board_stages")`), plus `Task.stageId?` (`stage BoardStage?` relation),
  `Task.boardPosition Int @default(0)`, `@@index([stageId, boardPosition])`.
  Seed: `packages/database/prisma/board-stages-seed.ts` (4 default TASKS stages
  TASKS_OPEN/TASKS_IN_PROGRESS/TASKS_WAITING/TASKS_DONE, colors
  slate/blue/amber/green, mapped to TaskStatus, idempotent upserts by code),
  called from `seed.ts`.
  Proofs: prisma validate + generate Passed; `corepack pnpm lint` + `typecheck`
  Passed. `db:push`/`db:seed` Not Run (no local DATABASE_URL; set env before
  running). Working tree is UNCOMMITTED (plus pre-existing unrelated edits to
  `packages/contracts/openapi.json`, `tools/lint.mjs`, `tools/web-proof.test.mjs`).

## Verified codebase knowledge (trust this; file paths checked)

### Stack

- Prisma schema: `packages/database/prisma/schema.prisma` (uses `prisma db push`,
  no migration files; seed via `tsx prisma/seed.ts`). Prisma 5.22.
- OpenAPI: `packages/contracts/openapi.json`; canonical source
  `tools/openapi-canonical.json`; checker `tools/openapi-check.mjs`
  (`corepack pnpm openapi:generate` / `openapi:check` — committed file must be
  byte-identical to canonical).
- Frontend: Next.js 16 App Router, React 19, Tailwind v3 + shadcn/ui (new-york)
  in `apps/web/src/components/ui/` (existing: button, card, dialog, input,
  select, tabs, table, badge, skeleton, textarea, label, sonner). Tokens:
  `apps/web/src/globals.css` + `apps/web/src/lib/tokens.ts` +
  `tailwind.config.ts`. NO dnd library installed anywhere.
- i18n: `?locale=` param → `apps/web/src/middleware.ts` injects `x-cms-locale`
  header → per-surface dictionaries `apps/web/src/i18n/*.ts` (en+ar, dir);
  `tools/i18n-lint.mjs` enforces. RTL via logical Tailwind utilities.
- Data clients: hand-written `apps/web/src/lib/*-api.ts` returning
  `{status:'ready'|'denied'|'error'}` unions (see `staff-tasks-api.ts`);
  mutations via colocated `actions.ts` server actions; CSRF helpers in
  `lib/staff-request-auth.ts`.
- Shell/nav: `apps/web/src/app/app-shell.tsx` (`staffNavItems`) + role-filtered
  nav in `apps/web/src/app/(staff)/layout.tsx`.
- Proofs: `tools/web-proof.mjs` renders real pages with fixtures
  (`tools/web-proof-fixtures.mjs` fake fetch; cases `tools/web-proof-cases.mjs`)
  → `pnpm test:visual` / accessibility / `web:perf`; Playwright via
  `tools/e2e-runner.mjs`; `web:visual-review` screenshots. New screens MUST be
  registered there. API tests: node:test files in `apps/api/test/**`
  (see `apps/api/test/tasks/manager-rollup.test.ts` for the exact pattern:
  instantiate service with stubbed repository, guard metadata assertions via
  GUARDS_METADATA, RbacGuard/PermissionGuard deny+audit tests).

### Tasks module (`apps/api/src/modules/tasks/`) — CRITICAL constraints

- `tasks.service.ts` is EXACTLY 300 lines and `tasks.repository.ts` is 281 —
  both at/near budget. DO NOT extend them. Put board logic in NEW files:
  `tasks.board.repository.ts`, `tasks.board.service.ts`, `dto/board.dto.ts`
  (mirrors existing `TasksRelatedRecordsService` pattern).
- Controller `tasks.controller.ts` (196 lines, room to add routes). Route order
  matters: add `@Get('board')` BEFORE the `@Get(':id')` handler. Guard pattern:
  reads = `@UseGuards(SessionAuthGuard, PermissionGuard)` +
  `@Permissions('COMPLAINT_COMMENT_INTERNAL')`; mutations add `CsrfGuard`.
  Helpers `requirePrincipal`, `taskActor`, `auditContext` already exist in the
  controller.
- Module wiring `tasks.module.ts`: providers use explicit
  `{provide, inject, useFactory}`; register new services the same way and add
  them to the controller constructor injection.
- Access rules `tasks.access.ts`: `assertCanView` / `assertCanAct(=assertCanManage)`
  (ADMIN → allow; participants (ownerId/assigneeId/nextActionWhoId/participants)
  → allow; else manager roles {CR_MANAGER, BRANCH_MANAGER, ADMIN, MGMT_READONLY}
  with matching task branch AND confidentialityLevel NORMAL; else RBAC_FORBIDDEN /
  BRANCH_SCOPE_FORBIDDEN AppException).
- Status rules: `TaskStatus` = OPEN|IN_PROGRESS|WAITING|DONE.
  `requiredStatusNote(from, to, note)` in `tasks.status-note.ts` — a note is
  REQUIRED when moving to DONE or WAITING (throws TASK_STATUS_NOTE_REQUIRED);
  note becomes a comment via `statusComment()`. Non-DONE statuses REQUIRE a
  nextAction (`assertNextAction` in tasks.service throws
  TASK_NEXT_ACTION_REQUIRED); DONE clears nextAction. A drag to Done/Waiting
  columns therefore needs a statusNote from the UI (dialog before commit);
  reopening from DONE needs a nextAction.
- Same-tx pattern to copy (from `updateStatus` in tasks.service.ts L80–106):
  find → mutate → `createStatusHistory` → optional comment →
  `auditService.record(taskAudit(...), client)` all inside
  `tasksRepository.transaction`.
- Response mapping: `taskToResponse` in `tasks.response.ts` (note: its
  taskSelect does NOT include stageId/boardPosition — board repo needs its own
  select and card mapper). `utcDay(now)` helper in `tasks.validation.ts` for
  due-today calc. DTO parser style: see `dto/update-task.dto.ts` (hand-rolled
  parse functions throwing AppException VALIDATION_FAILED, no class-validator).
- Errors: `AppException(code, message, httpStatus, details?)` from
  `core/http-kernel.ts`. Codes used: TASK_NOT_FOUND (404), RBAC_FORBIDDEN /
  BRANCH_SCOPE_FORBIDDEN (403), VALIDATION_FAILED (400).

## NEXT TASK — A2: `GET /tasks/board` (then continue checklist in order)

Design (settled):

- `tasks.board.repository.ts`: `listStages(scope)` (boardStage.findMany where
  scope + archivedAt null, orderBy position); `listBoardTasks(scope-flags)` with
  the same OR-scoping as `listPromiseTracker` in tasks.repository.ts L182–201
  (admin all / participant / manager+branch+NORMAL), including DONE only if
  updatedAt within 14 days (like listEmployeeToday); board select = id, title,
  ownerId, assigneeId, dueAt, status, stageId, boardPosition, isCustomerPromise,
  visibility, confidentialityLevel, createdAt, updatedAt, owner/assignee
  {nameEn, nameAr, branchId}, `_count.comments`.
- `tasks.board.service.ts` (`TasksBoardService`): `board(actor, now)` groups
  cards into stages — card's column = task.stageId if it matches an active
  TASKS stage, else the default stage whose mappedTaskStatus === task.status
  (fallback first stage); sort by boardPosition then dueAt. Card metrics:
  daysActive = floor((now-createdAt)/86400000); dueState OVERDUE/DUE_TODAY/
  UPCOMING (null when DONE) using `utcDay`. Response
  `{ stages: BoardStageDto[], columns: [{ stageId, cards: BoardCardDto[] }] }`.
- Controller: `@Get('board')` before `@Get(':id')`, SessionAuthGuard +
  PermissionGuard + `@Permissions('COMPLAINT_COMMENT_INTERNAL')`, actor from
  `taskActor(requirePrincipal(request))`.
- Tests in `apps/api/test/tasks/board.test.ts` following manager-rollup.test.ts
  style: scoping allowed + denied (employee sees only participant tasks;
  manager branch-scoped; confidential excluded for managers), guard metadata
  assertion, grouping/fallback/metrics unit tests.

Then **A3**: `POST /tasks/:id/move` in the same new files — tx: findById via
TasksRepository (full record for assertCanAct), validate stage (TASKS scope,
not archived, else 404 BOARD_STAGE_NOT_FOUND), status := stage.mappedTaskStatus
?? current.status, enforce requiredStatusNote + nextAction rules above, update
stageId/boardPosition/status, history + statusComment + audit ('task_moved',
metadata fromStage/toStage/fromStatus/toStatus) same-tx. Add both routes to
`tools/openapi-canonical.json`, run `openapi:generate` + `openapi:check`.

Then **A4–A8** (frontend board) per the SSOT checklist — read
`docs/CMSS_REVAMP_PLAN.md` §3 for the full remaining list (Phases A/B/C).

## Verification commands

`corepack pnpm lint` · `typecheck` · `test` · `test:api -- <suite>` ·
`openapi:generate`+`openapi:check` · `test:visual` ·
`test:e2e -- accessibility` · `web:visual-review` · `web:perf`.

High-risk tasks (A2/A3, later B1/B3/B4) record the security self-check in
`.forge/evidence.md`: session-only scoping, same-tx history+audit, one allowed
+ one denied boundary test, no secrets logged.
