# Phase C Handover — CMSS Trello-Style Board Revamp

**Phase A + Phase B are COMPLETE.** This document is the single entry point for a
fresh session to execute Phase C (proof & polish). Read it, then the SSOT
`docs/CMSS_REVAMP_PLAN.md` §Phase C, then `.forge/next.md`.

Required model tier: Opus 4.8 Max / GPT-5.5 Extra High.
SRS IDs in scope: `REQ-RBAC-001`, `UI-SCREEN-001`, `UI-DESIGN-001`,
`REQ-LOCALIZATION-001`, `METHOD-TEST-001`.

---

## 1. Where things stand

Two Kanban boards ship alongside the existing screens (old screens stay):
- **Task board** `/tasks/board` — sortable dnd (`@dnd-kit/sortable`), optimistic
  cross-column move + snapshot rollback, status-note dialog on 400, admin stage
  manager (MASTER_DATA_MANAGE), B3 department assignment popover, B6 detail drawer.
- **Ticket board** `/complaints/board` — drop-to-column dnd (`useDraggable` +
  `useDroppable`, NO sortable), NO optimistic move (drop → transition dialog →
  success revalidates → RSC re-places), illegal columns greyed, B6 detail drawer.
  Every drop drives the existing complaint state machine
  (`POST /complaints/:id/transitions`) — the client never decides state.

Commits on `feat/cmss-task-board`: Phase A `d85d76e`+`ff41d62`; B1 `21f5fa9`;
B2 `d21a8f7`; B3 `39bfd82`; B4 `7cc9c16`; B5 `b77ed9a`; SLA/side-effect fixes
`ec54efb`; B6.0 route-table extraction + B6 drawer (this push).

## 2. What Phase C must do

Phase C is **proof & polish only — no new feature code.** Three tasks:

### C1 — Full visual + a11y registration for both boards vs the Trello golden
- Register en LTR + ar RTL visual + accessibility cases for the task board and
  ticket board **including the open detail drawer**, and screenshot-review them.
- **Gotcha (critical):** the B6 drawer is a Radix `Sheet` = a portal that only
  mounts when open. `renderToStaticMarkup` (the engine behind `test:visual` /
  `web-visual-review` / accessibility) **cannot render the open drawer body.** So:
  - The static proof can register the **closed board + the card's detail-trigger
    button** (already rendered today).
  - For the **open** drawer, either (a) drive it live in a real browser over the
    hydrated board and screenshot, or (b) capture it in the C2 Playwright run.
    Do NOT sink time trying to force `renderToStaticMarkup` to mount the portal —
    that was consciously deferred here.
- Proof route plumbing already refactored: add any new route/case via
  `tools/web-proof-routes.mjs` (`routePage` + `STAFF_PROOF_PATHS`) — both
  `web-proof.mjs` and `web-visual-review.mjs` import it, so add once. Cases live
  in `tools/web-proof-cases.mjs`; fixtures in `tools/web-proof-fixtures.mjs`
  (+ `tools/web-proof-board-fixtures.mjs`). Mind the 300-line budget on all four.

### C2 — Playwright e2e
- Existing runner: `tools/e2e-runner.mjs` (`corepack pnpm test:e2e -- <name>`);
  the task-board dnd proof is `tools/task-board-dnd-proof.mjs`
  (`test:e2e -- task-board-dnd`) — copy its shape.
- Required cases: task drag (already have dnd proof — extend/keep), a
  **denied-scope** case (a user whose branch/role must NOT see or act on a card),
  the **ticket transition-with-reason** case (drop → dialog → reason → commit →
  card re-places), and the **B6 drawer interaction**: clicking a card opens the
  drawer, a **completed drag does NOT** open it (verify this explicitly — dnd-kit's
  distance threshold should prevent the click, but prove it), and fetch-on-open
  renders the updates/timeline.

### C3 — Gate + evidence
- Run and label honestly: `corepack pnpm openapi:check`, `lint` (boundary +
  budget), `i18n-lint`, coverage (`test`), plus `typecheck` and the full web/api
  suites.
- Append `.forge/evidence.md` with SRS IDs above; refresh `.forge/next.md` +
  `.forge/state.md`; tick C1/C2/C3 in the SSOT.

## 3. Live-drive recipe (for C1 open-drawer / C2, and to smoke B6 by hand)

The local stack was down at B6 handoff. To bring it up (all disposable localhost):
1. Postgres via docker (compose in repo). Seed: `corepack pnpm db:seed`
   (idempotent; seeds 13 board stages + 24 SLA policies + demo data).
2. Bootstrap a staff admin (disposable local creds the user provided earlier):
   ```
   $env:CMS_BOOTSTRAP_EMAIL="admin.local@cms-auto.test"
   $env:CMS_BOOTSTRAP_PASSWORD="ChangeMe12345!"
   $env:CMS_BOOTSTRAP_ROLE="ADMIN"
   corepack pnpm staff:bootstrap
   ```
3. Run API + web dev servers, sign in, open `/complaints/board` and `/tasks/board`.
4. **Known dev-runtime gotcha (already fixed, watch for regressions):** modules
   must use explicit `useFactory`/`inject` + `@Inject` DI — bare type-injection
   resolves to `undefined` under tsx/esbuild (no `design:paramtypes`). This caused
   the img.png 500 (SLA module), fixed in `ec54efb`.
5. Browser screenshots via CDP `Page.captureScreenshot` were flaky earlier
   (intermittent timeouts) — retry after a short wait; recreate the tab if the
   session goes stale after a DB reseed.

## 4. B6 file map (what to point the C1/C2 proofs at)

- Shared shell: `apps/web/src/components/board-detail/card-detail-sheet.tsx`
- Ticket adapter: `apps/web/src/components/complaint-board/detail-drawer.tsx`
  · data: `apps/web/src/lib/staff-complaint-board-detail-api.ts`
  · action: `complaintCardDetailAction` in
  `apps/web/src/app/(staff)/complaints/board/actions.ts`
- Task adapter: `apps/web/src/components/task-board/detail-drawer.tsx`
  · data: `apps/web/src/lib/staff-task-board-detail-api.ts`
  · action: `taskCardDetailAction` in
  `apps/web/src/app/(staff)/tasks/board/actions.ts`
- Trigger: card title `<button>` in `complaint-board/board-card.tsx`
  (`DraggableComplaintCard` `onOpen`) and `task-board/board-card.tsx`
  (`SortableBoardCard` `onOpen`); board state in each board `index.tsx`.
- i18n `detail.*`: `apps/web/src/i18n/staff-complaint-board.ts` +
  `apps/web/src/i18n/staff-task-board.ts` (en + ar).
- Unit tests: `apps/web/test/api-client/staff-{complaint,task}-board-detail-api.test.ts`

## 5. Locked conventions (do not relitigate)

- Backend owns all authority; React never decides complaint/task state.
- Roles + branch/department scope come from the server session only.
- OpenAPI: `tools/openapi-canonical.json` is hand-formatted — **splice** fragments,
  never full-rewrite; `openapi:generate` copies canonical → contracts;
  `openapi:check` verifies identical. (No Phase C route changes expected.)
- 300-line agentic budget on new app/package/tool source (tests + `*.dto.ts`
  exempt). On fresh Windows checkouts run `openapi:generate` once to normalize CRLF.
- Each task ≈ 1–5 files + tests; mark `[x]` in the SSOT after each.
