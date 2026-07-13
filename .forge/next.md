# CMSS Trello-Style Board Revamp — Phase A

Status: Plan approved; SSOT created at `docs/CMSS_REVAMP_PLAN.md`
Required model tier: Opus 4.8 Max or GPT-5.5 Extra High
Phase: CMSS Kanban revamp — Phase A (task board with drag & drop)
Risk: High (RBAC scoping, workflow-adjacent state changes, schema migration)
SRS IDs: `REQ-RBAC-001`, `UI-SCREEN-001`, `UI-DESIGN-001`,
`REQ-LOCALIZATION-001`, `METHOD-TEST-001`

## Task

Execute Phase A of `docs/CMSS_REVAMP_PLAN.md` (the SSOT — read it first),
task by task, starting at A1:

- A1: Prisma migration — `BoardStage` model, `Task.stageId?`, `Task.position`,
  seed default TASKS stages mapped to `TaskStatus`.
- A2: `GET /tasks/board` session-scoped read endpoint + scoping tests.
- A3: `POST /tasks/:id/move` (history + audit same-tx) + OpenAPI entries.
- A4–A8: dnd-kit + shadcn primitives, typed client, `/tasks/board` Kanban
  page (Trello UX, RTL, all states), mobile pass, visual/a11y/e2e proofs.

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
