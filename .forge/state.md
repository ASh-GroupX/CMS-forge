# Current State

Status: CMSS Kanban revamp — Phase A (d85d76e+ff41d62); B1 (21f5fa9) + B2 (d21a8f7) + B3 (39bfd82) + B4 (7cc9c16) + B5 (b77ed9a) + SLA/side-effect fixes (ec54efb) committed; B6.0 route-table extraction committed; B6 card detail drawer complete, uncommitted. PHASE B COMPLETE.
Phase: CMSS Trello-style board revamp — Phase B DONE → next is Phase C (proof & polish: C1 visual/a11y, C2 Playwright e2e, C3 openapi/lint/coverage + evidence)
Next Task: C1 — full visual + a11y registration for both boards incl. the OPEN drawer (see .forge/handover-phase-c.md)
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

- Phase A committed: d85d76e (A1–A3 backend) + ff41d62 (A4–A8 frontend).
- B1 shipped (uncommitted): `modules/board-stages/` CRUD module (staff-read
  GET; MASTER_DATA_MANAGE+CSRF create/update/reorder/archive; all-or-nothing
  reorder 409; archive requires same-scope destination, TASKS cards follow via
  `TasksBoardService.reassignStage` same-tx, TICKETS destination must map a
  status; CONFIG audit same-tx). TasksModule now exports TasksBoardService;
  `reassignStage` added to tasks.board.{repository,service}. 9 TICKETS stages
  seeded (one per ComplaintStatus, workflow order). OpenAPI: 5 ops + 7 schemas
  (additive splice — do NOT full-rewrite openapi-canonical.json, it is
  hand-formatted; splice fragments instead). `board-stages` suite registered
  in tools/api-test.mjs. Proofs: board-stages 8/8, tasks 35/35, lint, full
  typecheck, openapi:check Passed.

- B2 shipped (uncommitted): `lib/staff-board-stages-api.ts` typed client +
  4 stage server actions in `(staff)/tasks/board/actions.ts`;
  `components/task-board/stage-manager.tsx` Sheet (rename en+ar, token-color
  radio, up/down reorder with full ordered set, archive w/ destination
  select, add form with optional status mapping); island `stageManager` slot;
  page renders it only when the server principal has MASTER_DATA_MANAGE;
  `manage.*` i18n en+ar; proof principal got MASTER_DATA_MANAGE and the
  board visual case asserts the manage trigger. NOTE: no `useRouter` in
  proof-rendered client components (breaks static render — no app router).
  Proofs: api-client 67/67, visual 108, lint, tsc, i18n-lint Passed.

- B3 shipped (39bfd82): `Task.assignedDepartmentId?` + relation + index
  (prisma generate Passed; db:push Not Run). Session principal carries
  `departmentId` (auth repo selects ×2; `staffClaims` helper dedupes claims
  and keeps auth.service.ts under 300; StaffPrincipal/TaskActor extended;
  controller `taskActor()` on all task routes). `tasks.access.ts`
  `isDepartmentMember` grants dept view/act on NORMAL tasks only; the board
  OR-clause mirrors it. `updateForActor` EXTRACTED to new `tasks.update.ts`
  (tasks.service.ts was at 300) + PATCH/quick-add accept assignedDepartmentId
  (null clears; validated vs active departments → 400 field error; from/to
  dept audit metadata same-tx). Board response: card dept fields +
  `departments` reference list. OpenAPI spliced additively (6 schema edits).
  Web: `assignTaskDepartment` client + action; card dept chip → popover
  picker (optimistic + rollback); dnd `attributes` moved to a grip-handle
  button — fixes axe nested-interactive, pointer drag still whole-card;
  fixture board now includes `departments` (client rejects payloads without
  it). Proofs: tasks 42/42, auth 38/38, board-stages 8/8, api-client 69/69,
  test:web 213/213, visual 108, axe 24, task-board-dnd, lint, typecheck,
  openapi:check, i18n-lint — Passed. Screenshots self-reviewed en+ar.

- B4 shipped (uncommitted): `GET /complaints/board`. New
  `complaints.board.repository.ts` (`listStages` → active TICKETS
  `board_stages`, read-only shared reference data) +
  `complaints.board.service.ts` (`ComplaintsBoardService.board` reuses
  `ComplaintsService.listQueue` for identical branch/role session scoping and
  `allowedActionsFor` for per-card actions; pure `buildComplaintBoard` groups
  by `mappedComplaintStatus` — default, else lowest position, else first stage
  fallback; terminal CLOSED/REJECTED windowed 14d by `updatedAt`; each action
  tagged with `toStatus` via a module-level `WORKFLOW_TRANSITIONS` index —
  complaints.service.ts NOT grown) + `dto/complaint-board.dto.ts`. Controller
  `@Get('board')` placed BEFORE `@Get(':id')` (route-order shadowing), same
  guards as queue `list` (`SessionAuthGuard, PermissionGuard, RbacGuard`,
  `COMPLAINT_VIEW_BRANCH`, `@BranchScoped()`, no CSRF on GET); actor from the
  session (branch via `queueBranchId` → admins unrestricted, role, userId).
  Module wires both providers. OpenAPI additive splice (`/complaints/board` +
  ComplaintBoardStage/Transition/Card/Column/Response). MODULE.md notes the
  board service + read-only `board_stages`. Tests:
  `test/workflow/complaint-board.test.ts` (guard metadata, session
  branch/admin scoping, queue-filter pass-through, status→stage grouping
  variants, manager-allowed vs officer-denied allowedTransitions with target
  statuses, terminal window, no-PII). Fixed `complaints.controller.spec.ts`
  ctor (4th arg). Proofs: complaints suite 86/86, typecheck, lint,
  openapi:check Passed. Backend read only — no UI (B5).

- B5 shipped (uncommitted): `/complaints/board` transition-aware page.
  `lib/staff-complaint-board-api.ts` (load + server-side `transitionComplaint`,
  maps 409→conflict / 400→invalid{fields} / 401·403→denied / 404→not_found).
  `components/complaint-board/{index,board-card,board-column,transition-dialog,
  board-loading}.tsx`: dnd-kit drop-to-column only (useDraggable + useDroppable,
  NO sortable/arrayMove — complaints have no boardPosition), NO optimistic move
  (drop opens the dialog; on success the server action revalidates and the RSC
  re-places the card with its new status + allowedTransitions). Drop matches the
  target column's `mappedComplaintStatus` to the card's `allowedTransitions.
  toStatus` → fires that action via the existing `POST /complaints/:id/
  transitions`; illegal columns grey out + stop accepting the drop; same-column
  drop is a no-op (ADD_INVESTIGATION_UPDATE = IN_PROGRESS→IN_PROGRESS deferred to
  B6 card action). Dialog REUSES the workflow field matrix — `WorkflowFields`/
  `requiredFields`/`transitionRequest`/`destructiveActions` exported ADDITIVELY
  from `complaint-workflow-modal` (no rule drift with the detail page); grip drag
  handle (axe). `(staff)/complaints/board/{page,actions,loading}.tsx` (loads
  form-options + assignable staff for routing fields; `transitionComplaintAction`
  revalidates on success/conflict). `i18n/staff-complaint-board.ts` en+ar.
  `ticketBoard` nav (Columns icon, after Cases) in app-shell + layout ROLE_NAV/
  STAFF_NAV; `isActiveNav` queue branch excludes `/complaints/board`. Proof
  harness: `/complaints/board` fixture in new `tools/web-proof-board-fixtures.mjs`
  (imported by web-proof-fixtures.mjs to respect the 300-line budget),
  `staff-complaint-board` route in web-proof.mjs + web-visual-review.mjs, en/ar
  visual + a11y cases. Proofs: test:web shell 213/213 + api-client 73/73 (4 new)
  + localization 13/13, test:visual 110, test:e2e accessibility 26 (axe), lint,
  full typecheck Passed. STATIC-render screenshots self-reviewed en LTR + ar RTL
  (layout/RTL/badges only — no hydration; drag→transition→409-conflict is
  code-complete, owned by the C2 e2e). Keyboard drag uses the default
  KeyboardSensor getter (no SortableContext on this board).
  NOTE: `web:visual-review` flags a PRE-EXISTING horizontal-overflow on the
  unrelated `task board 390px` fallback case (reproduced with B5 nav changes
  stashed; the real task board 390px passes in test:visual).
  NOTE for B6: `tools/web-proof.mjs` is now at the 300-line budget — B6 (which
  adds a drawer route/import there and in web-visual-review.mjs) must START by
  extracting the route table / a render helper, not discover the failure mid-task.

- B6.0 shipped (committed): `tools/web-proof-routes.mjs` — shared route→React
  element map + fixture helpers extracted from web-proof.mjs (300→169) and
  web-visual-review.mjs (227→78), both now import `routePage`. De-duplicated a
  drifted routePage (visual-review had lost the task-board branch). Visual proof
  110 Passed; lint Passed.

- B6 shipped (uncommitted): card detail quick-look drawer for BOTH boards.
  Shared presentational `components/board-detail/card-detail-sheet.tsx` (Radix
  Sheet; header ref+title+badges, 2-col meta grid, read-only updates section,
  footer link to full detail) + two adapters:
  `components/complaint-board/detail-drawer.tsx` (status/severity/SLA/owner/
  branch/days-active + unified timeline via `complaintCardDetailAction` →
  `lib/staff-complaint-board-detail-api.ts` reusing `fetchComplaintTimeline`) and
  `components/task-board/detail-drawer.tsx` (status/assignee/owner/department/
  days-active/due + comments via `taskCardDetailAction` →
  `lib/staff-task-board-detail-api.ts` reusing `getStaffTaskComments`). Both
  server actions are read-only (no revalidate), session-scoped — no new read path
  bypasses authorization. Card TITLE became a keyboard-accessible quick-look
  trigger button (distinct from the grip/drag surface; pointer drag only starts
  past the 6px sensor threshold, so a click opens without moving). days-active =
  display arithmetic (ticket, from card.createdAt) / server-computed (task
  card.daysActive). i18n `detail.*` en+ar in both board i18n files. Links:
  ticket → `/complaints/:id`, task → `/tasks/:id` (general, not manager-only).
  Proofs: web typecheck, `test:web -- api-client` 79/79 (+6 new detail-client
  cases in `staff-complaint-board-detail-api.test.ts` +
  `staff-task-board-detail-api.test.ts`), `test:visual` 110, accessibility 26,
  `lint` — all Passed. VERIFIED LIVE (2026-07-17, real stack pg:5433/redis:6380/
  api tsx:3000/web:4000, seeded + bootstrapped admin.local): both boards' drawers
  open on card-title click (not drag); fetch-on-open resolves (ticket → timeline
  empty-state; task → a real inserted comment renders); overdue due-date shows red;
  a 342px drag does NOT open the drawer.
  STILL Phase C: the STATIC visual/a11y *registration* of the open drawer (Radix
  portal can't be `renderToStaticMarkup`-mounted) → C1 (live/Playwright screenshot)
  + C2 (e2e formalisation).

## Current Stop

Phase B is COMPLETE (B6 done in the working tree, uncommitted at time of
writing; committed with the B6 push). Next per SSOT: Phase C — C1 full visual +
a11y registration for both boards incl. the open drawer (drive live or via
Playwright since the portal won't static-render), C2 Playwright e2e (task drag,
denied-scope, ticket transition-with-reason, AND the B6 drawer interaction), C3
openapi:check/boundary lint/i18n-lint/coverage + append evidence.md (SRS IDs
REQ-RBAC-001, UI-SCREEN-001, UI-DESIGN-001, REQ-LOCALIZATION-001,
METHOD-TEST-001). Full handover: `.forge/handover-phase-c.md`.

## Open Carry-Forward / Known Debt

- A2 board card DTO intentionally omits `displayTimeZone` (branch tz) and
  `BoardStageDto` omits `isDefault`, matching the handover field list. If A6's
  card design shows an absolute due time (not relative), add `displayTimeZone`
  to the board select + `BoardCardDto` before A5 generates the typed client.
- A3–A8 of Phase A, then Phases B/C per SSOT.
- Deploy secrets + `production` branch + production smoke (human gates).
