# CMS-Auto — Agent Build Rules

Short rules every AI agent follows on every task. Depth lives in
`docs/ARCHITECTURE.md`. This file mirrors `AGENTS.md` — keep them identical.

## Read first (every task)
1. `.forge/next.md` — your scoped task and required model tier.
2. `.forge/project.md`, `.forge/policy.md`, `.forge/state.md`.
3. `docs/ARCHITECTURE.md` — the how.
4. `docs/CMS_AUTO_SRS.md` — only the requirement IDs your task cites.

## Precedence
SRS numbered requirements > `docs/ARCHITECTURE.md` > convenience. Never weaken
acceptance criteria, tests, security, audit, RBAC, branch scope, or portal privacy.

## Non-negotiables
- Backend (NestJS) owns all authority. React never decides complaint state.
- Roles and branch scope come from the **server session**, never client input.
- Every state change writes status history **and** an audit entry in the **same
  transaction**. Side effects (notifications, SLA jobs) enqueue **after commit**.
- Audit logs are append-only. Never log passwords, OTPs, tokens, or credentials.
- Customer portal never exposes internal comments, audit logs, DMS codes, staff
  PII, or unrelated complaints. Tracking requires verification, not a reference
  number alone.
- External systems go through backend adapters with a test double. No provider
  calls or secrets in the frontend.
- Every public/frontend route is documented in OpenAPI; `openapi:check` must pass.
- No business or workflow logic in UI components. No hardcoded user-facing strings
  (Arabic RTL + English LTR are acceptance criteria).

## How to add a module
1. Generate it from the module template — do **not** hand-roll structure.
2. Copy the golden CRUD module (`branches`) for CRUD + RBAC + audit + DTO + tests.
3. Use the canonical patterns in `docs/ARCHITECTURE.md` §6 — do not invent a new
   error, audit, RBAC, or transaction mechanism.
4. Controller = HTTP only. Service = business rules. Repository = this module's
   Prisma only. A module never imports another module's repository or models.
5. Fill in the generated `MODULE.md` (public service, owned tables, allowed deps,
   SRS IDs) — it is the module's agent context boundary and `lint` requires it.

## Verify (run, never assume)
Run the proof commands named in your task. Typical: `lint`, `typecheck`, `test`,
`test:api -- <suite>`, `openapi:check`, and for UI `test:visual` / `test:e2e --
accessibility`. If a script doesn't exist yet, create it — don't fake a pass.

Label honestly: `Passed` (ran + passed), `Failed`, `Not Run`, `Assumed`,
`Needs Human Review`. Claiming an unrun check as passed is the worst failure.

## Definition of Done
- Inside `next.md` scope (usually 1–5 files + tests).
- New app/package/tool source files stay under 300 lines; tests and `*.dto.ts` are
  exempt, as are canonical artifacts (`schema.prisma`, OpenAPI, migrations, generated
  files, docs). Don't split a cohesive unit just to dodge the budget.
- Structure from generator/golden module; canonical patterns used.
- Required tests pass and actually ran; trust boundaries + one allowed/one denied
  RBAC case covered.
- New routes in OpenAPI; boundary lint, typecheck, lint, coverage pass.
- Audit entries exist for state changes; no secrets logged.
- Cite SRS requirement IDs in `.forge/evidence.md`; update `next.md` + `state.md`.

## Scope discipline
Implement only the declared task. Record assumptions and gaps. If checks fail, set
state `Blocked`, write the smallest repair task, escalate the model tier.
If the task cannot stay near 1–5 files or would create a huge source file, stop
and replan instead of building a large diff.
