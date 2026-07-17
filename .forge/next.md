# CMSS Trello-Style Board Revamp — Phase A

Status: Phases A + B + C COMPLETE (uncommitted working tree). SSOT `docs/CMSS_REVAMP_PLAN.md` fully ticked.
Required model tier: Opus 4.8 Max or GPT-5.5 Extra High
Phase: CMSS Kanban revamp — Phase C (proof & polish) DONE. Next: commit the branch / open PR (human gate), then deploy carry-forward.
Risk: High (RBAC scoping, workflow-adjacent state changes, schema migration)
SRS IDs: `REQ-RBAC-001`, `UI-SCREEN-001`, `UI-DESIGN-001`,
`REQ-LOCALIZATION-001`, `METHOD-TEST-001`

## Task

Execute `docs/CMSS_REVAMP_PLAN.md` (the SSOT — read it first) task by task.
**Phase A committed (d85d76e + ff41d62); B1 (21f5fa9); B2 (d21a8f7); B3
(39bfd82); B4 (7cc9c16); B5 (b77ed9a); img.png SLA-DI + side-effect fixes
(ec54efb); B6.0 proof route-table extraction (committed); B6 card detail
drawer + f8f6b54 handover committed. Phase C (C1/C2/C3) DONE — cosmetic fixes
committed as 175e22a; proof tooling + docs uncommitted. PHASES A + B + C ALL COMPLETE.**

Phase C delivered (uncommitted): two handover cosmetic fixes (task drawer status
badge; ticket drawer live error state) + hermetic Playwright e2e via new
`tools/board-island-harness.mjs` — `board-drawer-proof.mjs` (C1 open-drawer
screenshots en+ar both boards + live axe; C2 click-opens/drag-doesn't-open/
fetch-on-open), `complaint-board-proof.mjs` (denied-scope + transition-with-reason),
and `task-board-dnd-proof.mjs` migrated onto the harness (fixes a silent post-B6
`process`/next-link bundle break). All gates Passed; evidence appended. See below
for the historical Phase A/B task log.

Phase C is proof & polish only — no new feature code:
- **C1**: full visual + a11y registration for BOTH boards (task + ticket),
  including the OPEN detail drawer, screenshot-reviewed vs the Trello-style
  golden (en LTR + ar RTL). NOTE: the drawer is a Radix Sheet portal that
  `renderToStaticMarkup` cannot mount, so a static proof case will not show the
  open body — drive it live (real browser over the hydrated board) or add a
  Playwright screenshot in C2 and register the closed-board + trigger-button in
  the static proof.
- **C2**: Playwright e2e — task drag, denied-scope case, ticket
  transition-with-reason case, AND the B6 drawer interaction (click-a-card-opens,
  completed-drag-does-NOT-open, fetch-on-open renders updates). This is where the
  B6 open-drawer behaviour gets its live proof (deferred here on purpose).
- **C3**: `openapi:check`, boundary lint, i18n-lint, coverage; append
  `.forge/evidence.md` (SRS IDs REQ-RBAC-001, UI-SCREEN-001, UI-DESIGN-001,
  REQ-LOCALIZATION-001, METHOD-TEST-001), update `next.md` + `state.md`.

A full Phase-C handover is at `.forge/handover-phase-c.md`.

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
- B4 (done, 7cc9c16): `GET /complaints/board` — new
  `complaints.board.{repository,service}.ts` + `dto/complaint-board.dto.ts` +
  controller route (queue guards, session scoping). Reuses `listQueue`
  (scoping) + `allowedActionsFor` (per-card actions tagged with `toStatus` via a
  `WORKFLOW_TRANSITIONS` index); TICKETS columns from `board_stages`; terminal
  columns windowed 14d. complaints suite 86/86.
- B5 (done, b77ed9a): `/complaints/board` transition-aware page. Typed client
  `staff-complaint-board-api.ts` (load + server-side `transitionComplaint`,
  409→conflict); `components/complaint-board/*` drop-to-column dnd (no optimistic
  move — drop opens a dialog; success revalidates and the RSC re-places the card);
  drop matches target column `mappedComplaintStatus` → card `allowedTransitions`
  → fires `POST /complaints/:id/transitions`; illegal columns greyed; same-column
  no-op. Dialog reuses the workflow field matrix exported from
  `complaint-workflow-modal`. `ticketBoard` nav entry; proof fixture + visual +
  a11y cases.
- img.png fix (ec54efb): the "ticket could not be moved" 500 was a dev-runtime
  (tsx/esbuild) DI failure in the SLA module — converted to explicit
  `useFactory`/`inject`; wrapped post-commit side effects in a non-fatal `safely()`
  so a side-effect throw never fails the committed transition; seeded 24 SLA
  policies. Verified live end-to-end earlier this session.
- B6.0 (done, committed): extracted `tools/web-proof-routes.mjs` (shared route→
  element map + fixtures) so web-proof.mjs 300→169 and web-visual-review 227→78.
- B6 (done, uncommitted): card detail drawer for BOTH boards. Shared
  presentational `components/board-detail/card-detail-sheet.tsx` (Radix Sheet) +
  two adapters (`complaint-board/detail-drawer.tsx`, `task-board/detail-drawer.tsx`).
  Card title is a keyboard-accessible quick-look trigger (distinct from the drag
  surface; pointer drag only starts past the 6px threshold). Fetch-on-open via
  read-only server actions (`complaintCardDetailAction`, `taskCardDetailAction`)
  reusing the authorized timeline / task-comments clients (new thin wrappers
  `staff-complaint-board-detail-api.ts`, `staff-task-board-detail-api.ts` — no new
  read path bypasses scope). Meta + read-only updates/timeline + link to the full
  detail page; the drop workflow and B3 dept control stay on the board. i18n en+ar.
  Passed: web typecheck, `test:web -- api-client` (79, +6 new), `test:visual` (110),
  accessibility (26), `lint`. Open-drawer visual/interaction proof deferred to C1/C2
  (Radix portal can't be statically rendered) — NOT driven live this session.

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
