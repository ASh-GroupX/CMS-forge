# CMSS Trello-Style Board Revamp — Phase A

Status: Plan approved; SSOT created at `docs/CMSS_REVAMP_PLAN.md`
Required model tier: Opus 4.8 Max or GPT-5.5 Extra High
Phase: CMSS Kanban revamp — Phase A (task board with drag & drop)
Risk: High (RBAC scoping, workflow-adjacent state changes, schema migration)
SRS IDs: `REQ-RBAC-001`, `UI-SCREEN-001`, `UI-DESIGN-001`,
`REQ-LOCALIZATION-001`, `METHOD-TEST-001`

## Task

Execute `docs/CMSS_REVAMP_PLAN.md` (the SSOT — read it first) task by task.
**Phase A committed (d85d76e + ff41d62); B1 committed (21f5fa9); B2 committed
(d21a8f7); B3 committed (39bfd82); B4 DONE (uncommitted). Next task: B5** —
`/complaints/board` page: a transition-aware ticket board that drives the
existing `POST /complaints/:id/transitions` (never a new state machine).
Consume `GET /complaints/board` (from B4: `stages`, `columns`, and per-card
`allowedTransitions: { action, toStatus }[]`). On drag to a column, resolve
the target column's `mappedComplaintStatus`, find the card's allowed
transition whose `toStatus` matches, and fire that action; grey columns with
no matching allowed transition; open a reason/resolution dialog for actions
that require it (REASON_REQUIRED / RESOLUTION_REQUIRED sets in
`complaints.service.ts`); surface a 409 conflict state on stale transitions.
Reuse `apps/web/src/components/task-board/*`; typed client + server action;
i18n en+ar; visual + a11y proofs + screenshot self-review (en LTR + ar RTL).

- A1 (done): Prisma migration — `BoardStage`, `Task.stageId?`, `Task.boardPosition`,
  seed default TASKS stages.
- A2 (done): `GET /tasks/board` session-scoped read + scoping tests; OpenAPI documented.
- A3 (done): `POST /tasks/:id/move` — stage→status derivation, same-tx history+audit,
  PATCH-shared note/next-action invariants, allowed+denied tests; OpenAPI documented.
  33/33 tasks tests + lint/typecheck/openapi:check Passed.
- A4 (done): `@dnd-kit/core@6.3.1` + `@dnd-kit/sortable@10` + `@dnd-kit/utilities`
  installed; avatar/tooltip/sheet/scroll-area/popover generated via shadcn CLI;
  board tokens (column/card/drop surfaces, `shadow-drag`, stage accents en dark
  variants) in `globals.css` + `tailwind.config.ts` + `lib/tokens.ts`.
- A5 (done): `lib/staff-board-api.ts` (`getTaskBoardLoadResult` + `moveTaskCard`
  with invalid/denied/not_found/error outcomes), `tasks/board/actions.ts` move
  server action, client-shape tests — 213/213 test:web.
- A6 (done): `/tasks/board` Kanban page + nav + i18n + proof-harness visual
  cases; screenshots self-reviewed en+ar.
- A7 (done): mobile Board/List switcher + responsive visual cases.
- A8 (done): board accessibility cases (axe, en+ar) + `test:e2e --
  task-board-dnd` real pointer-drag proof over the hydrated island.
- B1 (done, 21f5fa9): board-stages CRUD module + 9 TICKETS stage seed.
- B2 (done, d21a8f7): admin stage manager sheet on the board.
- B3 (done, 39bfd82): `Task.assignedDepartmentId?`; session principal carries
  departmentId; dept members view/act on NORMAL dept-assigned tasks (access rule
  + board OR-clause); PATCH/quick-add DTO + validation + audit in new
  `tasks.update.ts`; board returns departments list; card popover assignment
  control + grip drag handle (axe fix). tasks 42/42.
- B4 (done, uncommitted): `GET /complaints/board` — new
  `complaints.board.{repository,service}.ts` + `dto/complaint-board.dto.ts` +
  controller route (queue guards, session scoping). Reuses `listQueue`
  (scoping) + `allowedActionsFor` (per-card actions tagged with `toStatus` via a
  `WORKFLOW_TRANSITIONS` index); TICKETS columns from `board_stages`; terminal
  columns windowed 14d. OpenAPI spliced; complaints suite 86/86, typecheck,
  lint, openapi:check Passed. `test/workflow/complaint-board.test.ts`.
- B5–B6 then follow the SSOT: `/complaints/board` page (mapped columns over the
  existing transition endpoint), card detail drawer.

Constraints (locked decisions):
- Ticket stages (Phase B) are mapped columns over the existing complaint
  state machine — never bypass `POST /complaints/:id/transitions`.
- Boards ship alongside existing screens; old screens stay.
- Board reads are scoped from the server session only.
- Each task ≈ 1–5 files + tests; mark `[x]` in the SSOT after each task.

## Verification

Per task: `corepack pnpm lint`, `typecheck`, `test`, `test:api -- <suite>`,
`openapi:generate` + `openapi:check` on route changes; UI tasks additionally
`test:visual`, `test:e2e -- accessibility`, `web:visual-review` (en + ar).
High-risk tasks record the security self-check in `.forge/evidence.md`.

## Carry-Forward (from prior next.md — release automation)

- Needs Human Review: add repository deploy secrets (`DEPLOY_HOST`,
  `DEPLOY_USER`, `DEPLOY_KEY`, `DEPLOY_PATH`) in GitHub settings.
- Needs Human Review: create the `production` branch to trigger the
  auto-deploy pipeline (`.github/workflows/deploy.yml`), then run
  authenticated production smoke.
