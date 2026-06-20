# Build Task: P10-02A - Manager Control Room read model (no full stack needed)

Status: Ready to Build
Required model tier: BUILDER-STRONG
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Risk: High (RBAC + branch scope on team-wide visibility)

## Why this now (skip ahead past the stack-blocked screen)

P10-01A/B/C (Task model + invariant + quick-add + Today query) are done. P10-01D is
the Employee Today SCREEN - it needs the local stack (web + runtime) and is DEFERRED
until the stack is fixed. Do NOT stall there. Build the no-stack backend track. This
is the manager visibility the dealership needs and is unit/API-provable now with fakes.

## Scope (~1-5 files + tests)

- Manager rollup read model over tasks: overdue-by-employee, due-today, stuck (next
  action overdue / no movement), workload-by-assignee, escalated. Derived queries; no
  stored counters.
- RBAC + branch/team scope from the server session: a manager sees only their team/
  branch; an ordinary employee is denied; no cross-branch leak.
- API route(s) + OpenAPI; reuse the existing RBAC guard + task read patterns.

## Proof (no full stack needed)

- corepack pnpm lint, typecheck, test, openapi:check
- corepack pnpm test:api -- tasks: manager sees scoped rollup; employee denied;
  cross-branch denied; numbers derive from task/event data.
- Label web/runtime proof Not Run (deferred to stack repair).

## Exit

- Write the next no-stack task to next.md: P10-03A (escalation policy + due-date scan).
- Replace state.md (do not append).