# HANDOVER — CMSS Trello-Style Board Revamp

**For a fresh session. Start by reading, in order:**
1. This file.
2. `docs/CMSS_REVAMP_PLAN.md` — the SSOT checklist (mark `[x]` + summary after each task).
3. `.forge/next.md`, `.forge/state.md`, `.forge/policy.md` — current task + rules.
4. `CLAUDE.md` — non-negotiables. `docs/ARCHITECTURE.md` §6 for canonical patterns.

## Where we are (branch `feat/cmss-task-board`)

| Commit | Contents |
| --- | --- |
| `d85d76e` | A1–A3: BoardStage schema + seed; GET /tasks/board; POST /tasks/:id/move (backend) |
| `ff41d62` | A4–A8: dnd-kit Trello board frontend end-to-end + all proofs |
| `21f5fa9` | B1: board-stages CRUD module + 9 TICKETS stage seed |
| (this commit) | B2: admin stage manager UI + this handover |

**Phase A is fully shipped**: `/tasks/board` Kanban with optimistic drag,
status-note dialog, mobile Board/List switcher, en+ar RTL, visual (108) +
axe (24) + real Chromium drag e2e (`test:e2e -- task-board-dnd`) proofs.
**B1**: `/board-stages` CRUD (staff read; MASTER_DATA_MANAGE+CSRF writes;
all-or-nothing reorder → 409; archive requires same-scope destination, TASKS
cards follow via `TasksBoardService.reassignStage` same-tx). **B2**: admin
stage manager sheet on the board (rename en+ar, token colors, reorder,
archive w/ destination, add stage), gated by the server principal.

## Next task: B3 — task department assignment

- `Task.assignedDepartmentId?` in `packages/database/prisma/schema.prisma`
  (+ `prisma generate` with a placeholder `DATABASE_URL`, see gotchas).
- Extend `apps/api/src/modules/tasks/tasks.access.ts` (47 lines): department
  members may view/act on dept-assigned tasks. Extend create/update DTO +
  board scoping (`tasks.board.repository.ts` OR-clause) accordingly.
- Board assignment controls (assign to department or staff) + one allowed +
  one denied test. **Budget alert**: `tasks.service.ts` is AT the 300-line
  budget and `tasks.repository.ts` ~282 — put new logic in the board files
  (`tasks.board.repository.ts` 119, `tasks.board.service.ts` ~185) or new files.

Then: **B4** `GET /complaints/board` (TICKETS stages + queue-scoped cards +
per-card `allowedTransitions` from `WORKFLOW_TRANSITIONS` in
`complaints.service.ts`; copy the tasks board service/repo pattern into the
complaints module). **B5** `/complaints/board` page (reuse
`components/task-board` patterns; drags call the existing
`POST /complaints/:id/transitions` — never a new state machine; illegal
targets greyed; reason/resolution dialog; 409 conflict state). **B6** card
detail drawer (existing comments/timeline APIs). **C1–C3** final proofs +
`.forge/evidence.md` SRS citations.

## Locked decisions (user-confirmed — do not relitigate)

1. Ticket columns are **mapped columns** over `ComplaintStatus`; admin can
   rename/recolor/reorder but transitions always go through the backend.
2. Boards ship **alongside** existing screens.
3. DnD = `@dnd-kit/core` + `@dnd-kit/sortable` (installed).
4. No state library: RSC loader + `'use client'` island + server actions.
5. Board reads are **server-session-scoped**; frontend never filters for privacy.

## Key files

- Backend board: `apps/api/src/modules/tasks/tasks.board.{repository,service}.ts`,
  `dto/{board,move-task}.dto.ts`; stages module `apps/api/src/modules/board-stages/*`.
- Frontend: `apps/web/src/components/task-board/{index,board-card,board-column,stage-manager,board-loading}.tsx`;
  `apps/web/src/app/(staff)/tasks/board/{page,actions,loading}.tsx`;
  clients `apps/web/src/lib/staff-board{,-stages}-api.ts`; i18n
  `apps/web/src/i18n/staff-task-board.ts`; tokens in `globals.css`
  (`--board-*`, `--stage-{slate,blue,amber,green,red,violet}[-bg]`).
- Proofs: `tools/web-proof{,-cases,-fixtures}.mjs` (`staff-board` route),
  `tools/task-board-dnd-proof.mjs`, suites in `tools/{api-test,web-test}.mjs`.

## Gotchas (hard-won — trust these)

- **No local DB**: `DATABASE_URL` unset. For prisma validate/generate:
  `$env:DATABASE_URL='postgresql://user:pass@localhost:5432/cms'`. `db:push`/
  `db:seed` stay **Not Run** — label honestly.
- **OpenAPI**: `tools/openapi-canonical.json` is hand-formatted — NEVER
  full-rewrite via JSON.stringify (2k-line reformat). Splice fragments as
  text (see `.forge/state.md` B1 note), then `openapi:generate` + `openapi:check`.
- **CRLF**: fresh checkout (`core.autocrlf=true`) fails byte-exact
  `openapi:check` — run `corepack pnpm openapi:generate` once (no diff).
- **shadcn CLI needs pnpm on PATH**: `corepack enable --install-directory
  <scratchpad>/corepack-shims` then prepend to PATH.
- **No `useRouter`** in client components the proof harness renders
  statically (no app router mounted → invariant crash).
- New api test dirs must be registered in `tools/api-test.mjs` allowedSuites.
- `test:web` runs only the `shell` suite; run `node tools/web-test.mjs
  api-client` for client tests (67 tests currently).
- 300-line budget applies to `tools/*.mjs` too (web-proof.mjs is AT 300).
- Playwright/esbuild are not hoisted: resolve via
  `node_modules/.pnpm/{playwright-core@*,esbuild@*}/node_modules/...`
  (see `tools/task-board-dnd-proof.mjs` helpers).
- dnd-kit sortable attributes put `role="button"` on the host — attach them
  to an inner `<div>`, never the `<li>` (axe `list` violation).

## Verification per task (run, never assume; label honestly)

`corepack pnpm lint` · `typecheck` · `test:api -- tasks|board-stages` ·
`node tools/web-test.mjs api-client` · `test:web` · `test:visual` ·
`test:e2e -- accessibility` · `test:e2e -- task-board-dnd` ·
`openapi:generate`+`openapi:check` on route changes · `node tools/i18n-lint.mjs`.
UI tasks: render + screenshot (hydrate via the dnd-proof esbuild pattern for
client-only states) + self-review en+ar before "done".

## Carry-forward human gates

- Deploy secrets (`DEPLOY_HOST/USER/KEY/PATH`) in GitHub settings.
- Create `production` branch to trigger deploy; production smoke after.
