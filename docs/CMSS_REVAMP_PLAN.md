# CMSS Revamp Plan — Trello-Style Task & Ticket Boards

Single source of truth (SSOT) for the CMSS (Staff Operations) Kanban revamp.
Mark items `[x]` as they complete. Scope discipline per `.forge/policy.md`:
each task ≈ 1–5 files + tests; stop and replan if a task grows.

**Priority directive: the Trello-like drag-and-drop task board UI/UX ships
first (Phase A), end-to-end, before ticket board / admin stages / department
assignment (Phase B).**

---

## 1. Current State Analysis

### Stack

| Layer | What we have |
| --- | --- |
| Backend | NestJS-style modular monolith `apps/api/src/modules/*` (18 modules) |
| DB | PostgreSQL via Prisma — schema at `packages/database/prisma/schema.prisma` |
| API contract | `packages/contracts/openapi.json` + canonical `tools/openapi-canonical.json`, checked by `tools/openapi-check.mjs` (`openapi:generate` / `openapi:check`) |
| Frontend | Next.js 16 App Router, React 19, RSC + server actions (no client state library) |
| Styling | Tailwind v3 + shadcn/ui (new-york) in `apps/web/src/components/ui/`; tokens in `apps/web/src/globals.css` + `apps/web/src/lib/tokens.ts` |
| i18n | Hand-rolled: `?locale=` → `apps/web/src/middleware.ts` header → per-surface dictionaries in `apps/web/src/i18n/*.ts` (en+ar); RTL via logical properties; `tools/i18n-lint.mjs` |
| Data clients | Hand-written `apps/web/src/lib/*-api.ts` returning `{status:'ready'|'denied'|'error'}` unions; mutations via colocated `actions.ts` server actions; CSRF helpers `lib/staff-request-auth.ts` |
| Shell | `apps/web/src/app/app-shell.tsx` (`staffNavItems`) + role-filtered nav in `apps/web/src/app/(staff)/layout.tsx` |
| Proofs | `tools/web-proof.mjs` + `tools/web-proof-cases.mjs` + `tools/web-proof-fixtures.mjs` (visual/a11y/perf), Playwright via `tools/e2e-runner.mjs`, `web:visual-review` |
| DnD | **None installed** — this effort introduces the first drag-drop dependency |

### Domain (what we build on)

- **Task** (`schema.prisma` ~L914): required `assigneeId` (User), `ownerId`,
  `status: TaskStatus (OPEN|IN_PROGRESS|WAITING|DONE)`, visibility +
  confidentiality, `TaskStatusHistory`, `TaskComment` (+mentions),
  `TaskParticipant`, polymorphic `TaskLink`. Record-level access in
  `apps/api/src/modules/tasks/tasks.access.ts` (ADMIN, participants, branch
  managers when confidentiality NORMAL). Update endpoint `PATCH /tasks/:id`.
  **No department assignment today.**
- **Complaint** (~L508): `status: ComplaintStatus` enum (9 states), `ownerId?`,
  `branchId`, `departmentId?`, optimistic `version`. Backend state machine =
  `WORKFLOW_TRANSITIONS` in `apps/api/src/modules/complaints/complaints.service.ts`;
  transitions only via `POST /complaints/:id/transitions`; some actions require
  reason/resolution/owner; illegal → 409; role failure → 403 + SECURITY audit.
- **Same-transaction rule** (everywhere): status history + audit rows are
  written inside the repository `transaction(client => …)` with
  `auditService.record(…, client)`; side effects enqueue after commit.
- **RBAC**: `SessionAuthGuard` / `PermissionGuard` / `RbacGuard`
  (+`@BranchScoped()`) / `DynamicPermissionGuard` in
  `apps/api/src/core/auth.guard.ts`; `CsrfGuard` on mutations. Roles and
  permissions are DB rows; principal comes from the `cms_staff_session` cookie.
- **Screens being wrapped/replaced**: tasks `apps/web/src/app/(staff)/tasks/*`
  (`components/employee-today`, `sent-tasks`, `task-conversation`); complaints
  `(staff)/complaints/*` (`components/work-queue`,
  `complaint-detail-workspace`). Deals handoff board is static columns —
  visual reference only.
- **Reusable for card threading/timeline**: `POST/GET /tasks/:id/comments`,
  `POST/GET /complaints/:id/comments`, `GET /complaints/:id/timeline`.
  Days-active derives from `createdAt` + status history.
- **Golden CRUD module**: `apps/api/src/modules/branches` (copy for new modules).

## 2. Technical Decisions

1. **DnD library: `@dnd-kit/core` + `@dnd-kit/sortable`** — React 19
   compatible, headless (fits shadcn/tokens), RTL-friendly, keyboard-accessible
   sensors.
2. **Stages are DB rows, not enums**: new `BoardStage` model —
   `id, scope (TASKS|TICKETS), nameEn, nameAr, color, position, isDefault,
   archivedAt`, plus `mappedTaskStatus?` (TASKS) / `mappedComplaintStatus?`
   (TICKETS). Tasks get `Task.stageId?` (null → derived from `TaskStatus`
   default mapping) and `Task.position` for in-column ordering. Seed defaults.
3. **Ticket board = mapped columns (decision locked)**: admin can rename /
   recolor / reorder ticket columns, but each maps to an existing
   `ComplaintStatus`; a drag fires the real workflow transition via the
   existing `POST /complaints/:id/transitions`; illegal targets are greyed
   out; transitions requiring reason/resolution open a dialog first. The
   backend state machine is never bypassed (SRS authority preserved).
4. **Board reads are server-scoped**: `GET /tasks/board` and
   `GET /complaints/board` return only what the session principal may see
   (role, branch, department, participants). The frontend never filters for
   privacy.
5. **Task moves**: `POST /tasks/:id/move` (stageId + position) derives
   `TaskStatus` from the stage mapping, writes `TaskStatusHistory` + audit in
   the same transaction.
6. **Frontend architecture**: RSC page loader + `'use client'` Kanban island;
   optimistic updates via `useOptimistic` + server actions; rollback + toast
   on 403/409. No new state library.
7. **Rollout (decision locked)**: boards ship alongside existing screens as
   the primary nav entries; old list/detail screens stay; the board card
   drawer reuses existing detail/comments APIs.
8. **UI discipline**: primitives via shadcn CLI only; Trello-ish look (clean
   blues/grays, subtle shadows, labels/badges, drag tilt, highlighted drop
   zones) built on the existing token system; all strings en+ar; every new
   screen registered in the visual-proof harness.

## 3. Master Task Checklist

### Phase 0 — SSOT
- [x] **T0**: Create this file; update `.forge/next.md` + `.forge/state.md`.

### Phase A — Task board with Trello-style drag & drop (core deliverable)
- [x] **A1**: Prisma migration — `BoardStage`, `Task.stageId?`,
  `Task.boardPosition`; seed default TASKS stages (Open / In Progress /
  Waiting / Done) mapped to `TaskStatus`. (Schema valid, client generated,
  lint+typecheck Passed; `db:push`/`db:seed` Not Run — no local DATABASE_URL.)
- [x] **A2**: `GET /tasks/board` — session-scoped payload (columns, permitted
  cards, daysActive/due metrics); tests incl. scoping denial. (New
  `tasks.board.repository.ts` + `tasks.board.service.ts` + `dto/board.dto.ts` +
  `test/tasks/board.test.ts`; 24/24 tasks tests, lint/typecheck Passed.
  `GET /tasks/board` documented in OpenAPI — `openapi:generate`+`openapi:check`
  Passed. `POST /tasks/:id/move` OpenAPI entry lands in A3.)
- [x] **A3**: `POST /tasks/:id/move` — stage+position, history+audit same-tx,
  conflict handling, allowed+denied tests; OpenAPI entries for A2/A3. (Move logic
  in the same board files: `findStage`/`moveTask` in `tasks.board.repository.ts`,
  `TasksBoardService.move` reusing the PATCH next-action/status-note invariants;
  `dto/move-task.dto.ts` parser; 11 move tests — guards, allowed/denied,
  stage-not-found, note & next-action rules, in/out-of-scope next-action assignee
  (branch-scope guard via `assertAssignable`, parity with PATCH), same-tx client
  identity, audit metadata. `POST /tasks/{id}/move` + `GET /tasks/board` documented
  in OpenAPI. 35/35 tasks tests, lint/typecheck/openapi:check Passed.)
- [x] **A4**: Add `@dnd-kit/core` + `@dnd-kit/sortable`; shadcn primitives
  (avatar, tooltip, sheet, scroll-area, popover); board design tokens.
  (`@dnd-kit/core@6.3.1` + `sortable@10` + `utilities@3.2.2` installed;
  5 primitives generated via shadcn CLI; board tokens — column/card/drop
  surfaces, `shadow-drag`, `stage-{slate,blue,amber,green,red,violet}` accents
  with dark variants — in `globals.css` + `tailwind.config.ts` + `lib/tokens.ts`.
  lint + web typecheck Passed.)
- [x] **A5**: Typed client `lib/staff-board-api.ts` + move server action;
  client-shape tests. (`getTaskBoardLoadResult` + `moveTaskCard` mirroring
  `dto/board.dto.ts`; move surfaces `invalid` (400 + field list, for the A6
  note dialog), `denied`, `not_found`, `error`; CSRF header from cookie;
  `tasks/board/actions.ts` `moveTaskCardAction` with revalidate;
  `test/api-client/staff-board-api.test.ts` — 213/213 web tests, lint +
  typecheck Passed.)
- [x] **A6**: `/tasks/board` page — the Trello experience: columns, rich cards
  (assignee avatar, due badge, days-active, labels), drag tilt, highlighted
  drop zones, drag overlay, optimistic move + rollback toast, hover/transition
  animations, RTL, loading/empty/error/denied states, i18n en+ar; nav entry.
  (`components/task-board/{index,board-card,board-column,board-loading}.tsx`,
  `(staff)/tasks/board/{page,loading}.tsx`, `i18n/staff-task-board.ts`; dnd-kit
  island with optimistic cross-column move + snapshot rollback, status-note
  dialog on 400, sonner toasts, keyboard sensors + SR announcements; 'board'
  nav entry (KanbanSquare) for all staff roles. Registered `staff-board` in the
  proof harness (fixture + en/ar visual cases) — visual proof 102 previews
  Passed; screenshots self-reviewed en LTR + ar RTL. lint/typecheck/test:web
  213/213/i18n-lint Passed.)
- [x] **A7**: Mobile board — horizontal snap-scroll columns + list switcher,
  44px touch targets, touch sensors. (Board/List toggle (`min-h-11`, mobile
  only, `aria-pressed`) in the island; list layout stacks full-width columns
  (`w-full lg:w-72`); snap-scroll + TouchSensor were in A6. en 390px + ar
  390–1440px visual cases registered — 108 previews Passed; 390px screenshots
  self-reviewed en+ar. lint/tsc Passed.)
- [x] **A8**: Visual + a11y proofs (register in `web-proof-cases.mjs` +
  fixtures), screenshot self-review en+ar, Playwright e2e drag test.
  (Visual cases + fixture landed with A6/A7 — 108 previews. Accessibility
  cases en+ar registered — 24 previews with axe; fixed 2 serious violations
  (sortable role=button moved off the `<li>`; avatar/badge/empty-hint
  contrast). New `tools/task-board-dnd-proof.mjs` via `test:e2e --
  task-board-dnd`: esbuild-bundles the real island + fixture, hydrates in
  Chromium, performs a genuine pointer drag Open→In Progress, asserts the
  DOM move, the committed `{stageId, boardPosition}` payload, and the success
  toast. All Passed.)

### Phase B — Ticket board, assignment, dynamic stages
- [x] **B1**: `board-stages` module (copy `branches`): CRUD + reorder,
  ADMIN-manage/staff-read RBAC, audit, DTOs, MODULE.md, OpenAPI,
  allowed+denied tests; stage delete requires destination; seed TICKETS stages.
  (`modules/board-stages/{repository,service,controller,module,MODULE.md,dto/*}`;
  GET staff-read + POST/PATCH/reorder/archive under MASTER_DATA_MANAGE+CSRF;
  all-or-nothing reorder (409 on stale sets); archive requires a same-scope
  destination — TASKS cards follow via `TasksBoardService.reassignStage` on the
  SAME transaction, TICKETS destination must map a status; CONFIG audit same-tx.
  9 TICKETS stages seeded (one per ComplaintStatus, workflow order). 5 routes +
  7 schemas in OpenAPI (additive splice). `test:api -- board-stages` 8/8,
  tasks 35/35, lint, full typecheck, openapi:check Passed.)
- [x] **B2**: Admin stage management UI — add/rename/recolor/reorder/archive
  inline on the board. (`components/task-board/stage-manager.tsx` sheet —
  per-stage rename en+ar, token-color radio picker, up/down reorder (sends the
  full ordered set), archive with destination select, add-stage form with
  optional status mapping; wired via `lib/staff-board-stages-api.ts` typed
  client + 4 server actions; rendered only for principals with
  MASTER_DATA_MANAGE (server-checked in page.tsx). 3 client-shape tests
  (api-client 67/67); visual proof 108 with manage-trigger signal; hydrated
  open-sheet screenshots self-reviewed en LTR + ar RTL (start-side sheet).
  lint/tsc/i18n-lint Passed.)
- [x] **B3**: Task department assignment — `Task.assignedDepartmentId?`
  migration + DTO + `tasks.access.ts` extension + board assignment controls;
  allowed/denied tests.
  (Done: `Task.assignedDepartmentId?` + `Department.tasks` relation + index in
  schema.prisma — prisma validate/generate Passed, db:push Not Run (no local
  DB). Session principal now carries `departmentId` end-to-end: auth repository
  selects it, `staffClaims` helper dedupes login/session claims, StaffPrincipal
  + TaskActor extended, controller `taskActor()` reused on every task route.
  `tasks.access.ts` grants dept members view/act on NORMAL tasks assigned to
  their department (confidential stays participant-only), mirrored in the board
  OR-clause. PATCH + quick-add DTOs accept `assignedDepartmentId` (null clears),
  validated against active departments in new `tasks.update.ts` (updateForActor
  extracted there — tasks.service.ts was AT the 300 budget) with from/to
  department audit metadata same-tx. `GET /tasks/board` cards carry department
  names + response gains the active `departments` reference list. OpenAPI
  spliced additively (Task, TaskQuickAddRequest, TaskUpdateRequest, BoardCard,
  TaskBoardResponse, BoardDepartment). Frontend: `assignTaskDepartment` client
  + server action; card department chip opens a popover picker (optimistic
  update + rollback, en+ar toasts); dnd-kit `attributes` moved to a grip-handle
  button so no interactive control nests inside role="button" (axe
  nested-interactive fix; whole-card pointer drag preserved).
  Proofs: tasks 42/42 (7 new incl. dept allowed+denied), auth 38/38,
  board-stages 8/8, api-client 69/69, test:web 213/213, visual 108, axe 24,
  task-board-dnd e2e, lint, typecheck, openapi:check, i18n-lint — all Passed;
  hydrated popover screenshots self-reviewed en LTR + ar RTL.)
- [x] **B4**: `GET /complaints/board` — TICKETS stage columns, queue-scoped
  cards, per-card `allowedTransitions`; tests.
  (New `complaints.board.{repository,service}.ts` + `dto/complaint-board.dto.ts`;
  route added to `complaints.controller.ts` with the same guards as the queue
  `list` (`SessionAuthGuard, PermissionGuard, RbacGuard`, `COMPLAINT_VIEW_BRANCH`,
  `@BranchScoped()` — no CSRF on a GET). Board service reuses
  `ComplaintsService.listQueue` for identical branch/role session scoping and
  `allowedActionsFor` for per-card actions, each tagged with its target status
  via a `WORKFLOW_TRANSITIONS` index — so `complaints.service.ts` does not grow
  and React never reconstructs the state machine. Columns come from active
  TICKETS `board_stages` (read-only; grouping prefers the default stage, else
  lowest position, else the first stage as fallback so no card is dropped).
  Terminal columns (CLOSED/REJECTED) windowed to 14 days by last activity so they
  never grow unbounded. OpenAPI additive splice (`/complaints/board` +
  ComplaintBoardStage/Transition/Card/Column/Response), `openapi:generate` +
  `openapi:check` Passed. Tests in `test/workflow/complaint-board.test.ts`:
  guard metadata, session branch/admin scoping, queue-filter pass-through,
  status→stage grouping (default/lowest-position/fallback), manager-allowed vs
  officer-denied `allowedTransitions` with target statuses, terminal window,
  no-PII projection — complaints suite 86/86, typecheck, lint, openapi:check
  Passed. Backend read only — no UI (that is B5).)
- [x] **B5**: `/complaints/board` page — transition-aware drag,
  reason/resolution dialog, 409 conflict state.
  (New `lib/staff-complaint-board-api.ts` typed client — `getComplaintBoardLoadResult`
  + server-side `transitionComplaint` (direct API call, 409→conflict) so a server
  action can revalidate. `components/complaint-board/{index,board-card,board-column,
  transition-dialog,board-loading}.tsx`: drop-to-column dnd-kit (useDraggable +
  useDroppable, no sortable reorder — complaints have no in-column order), no
  optimistic move (drop opens the dialog; on success the RSC refetches and re-places
  the card with fresh status + transitions). On drop the target column's
  `mappedComplaintStatus` is matched to the card's `allowedTransitions.toStatus` →
  fires that action via the existing `POST /complaints/:id/transitions`; illegal
  columns grey out and stop accepting the drop; same-column drop is a no-op
  (ADD_INVESTIGATION_UPDATE stays a B6 card action). The dialog REUSES the workflow
  field matrix (`WorkflowFields`/`requiredFields`/`transitionRequest`/
  `destructiveActions` exported additively from `complaint-workflow-modal`) so the
  reason/resolution/routing rules never drift; 409 shows the conflict state.
  `(staff)/complaints/board/{page,actions,loading}.tsx` (loads form-options + staff
  for routing fields; `transitionComplaintAction` revalidates on success/conflict).
  `i18n/staff-complaint-board.ts` en+ar; `ticketBoard` nav entry (Columns icon,
  after Cases) with queue active-match fixed. Proof harness: `/complaints/board`
  fixture (`web-proof-board-fixtures.mjs`), `staff-complaint-board` route +
  en/ar visual + a11y cases. Proofs: test:web shell 213/213 + api-client 73/73
  (4 new) + localization 13/13, test:visual 110, test:e2e accessibility 26 (axe),
  lint, full typecheck — Passed. STATIC-render screenshots self-reviewed en LTR +
  ar RTL (layout/RTL/badges); the interactive drag→transition→409-conflict flow is
  code-complete and owned by the C2 Playwright e2e (ticket transition-with-reason).)
- [x] **B6**: Card detail drawer (both boards) — threaded updates via existing
  comments APIs, timeline, days-active, assignment controls, link to detail page.
  (Done. Shared presentational `CardDetailSheet` shell + two per-board adapters
  (`complaint-board/detail-drawer`, `task-board/detail-drawer`); the card title is
  a keyboard-accessible quick-look trigger, distinct from the drag surface (pointer
  drag only starts past the 6px sensor threshold). Fetch-on-open via read-only
  server actions (`complaintCardDetailAction`, `taskCardDetailAction`) reusing the
  already-authorized timeline / task-comments clients — no new read path bypasses
  scope. Ticket drawer shows status/severity/SLA/owner/branch/days-active + the
  unified timeline; task drawer shows status/assignee/owner/department/days-active/
  due + comments; both link to the full detail page for heavy actions (the drop
  workflow and B3 department control stay on the board). days-active is display
  arithmetic (ticket) / server-computed (task). i18n en+ar. Proof groundwork:
  `tools/web-proof-routes.mjs` extracted first so web-proof.mjs (300→169) had room.
  Passed: web typecheck, `test:web -- api-client` (79, incl. 6 new detail-client
  cases), `test:visual` (110), accessibility (26), `lint`. VERIFIED LIVE (real
  stack): both boards' drawers open on card-title click (not drag), fetch-on-open
  resolves (ticket → timeline empty-state; task → a real comment renders), overdue
  due-date shows red, and a drag does not open the drawer. Still owned by Phase C:
  the STATIC visual/a11y *registration* of the open drawer — `renderToStaticMarkup`
  cannot mount the Radix portal, so C1 captures it via live/Playwright screenshot
  and C2 formalises the interaction in the e2e suite.)

### Phase C — Proof & polish
- [x] **C1**: Full visual + a11y registration for both boards incl. the OPEN
  drawer (hermetic Playwright hydrates the real island so the Radix Sheet portal
  mounts — `tools/board-drawer-proof.mjs`); en LTR + ar RTL screenshots reviewed
  vs the Trello-style golden + live axe on the open drawer. Cosmetic fixes landed:
  task drawer now shows a status **badge** (was a mono reference-slot label);
  ticket drawer now surfaces a real fetch error state (was dead code).
- [x] **C2**: Playwright e2e (hermetic island harness `tools/board-island-harness.mjs`):
  task drag (`task-board-dnd`), denied-scope + ticket transition-with-reason
  (`complaint-board`), and the drawer interaction — click-opens / drag-does-NOT-open /
  fetch-on-open (`board-drawer`). Denial flows through server-computed
  `allowedTransitions`; server-side scope withholding stays proven in the API suite.
- [x] **C3**: `openapi:check`, boundary lint, coverage `test`, `typecheck`,
  `test:web`, `test:visual`, static `accessibility` — all Passed; evidence appended
  (SRS IDs: REQ-RBAC-001, UI-SCREEN-001, UI-DESIGN-001, REQ-LOCALIZATION-001,
  METHOD-TEST-001), `next.md` + `state.md` refreshed.

## 4. Verification (run, never assume; label honestly)

- `corepack pnpm lint` · `typecheck` · `test` · `test:api -- <suite>`
- `corepack pnpm openapi:generate` + `openapi:check` after route changes
- `corepack pnpm test:visual` · `test:e2e -- accessibility` ·
  `web:visual-review` (inspect en + ar board screenshots) · `web:perf`
- Security self-check for High-risk tasks (A2/A3/B1/B3/B4): session-only
  scoping, same-tx history+audit, one allowed + one denied boundary test,
  no secrets logged.

## 5. Execution Protocol

After each task: mark `[x]` here, summarize what changed and what is next,
update `.forge/next.md` + `.forge/state.md`, record evidence + SRS IDs in
`.forge/evidence.md`. If a task exceeds ~5 files, stop and replan.
