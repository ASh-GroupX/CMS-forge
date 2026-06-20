# Build Task: P10-01A - Task domain model + next-action invariant (no full stack needed)

Status: Ready to Build
Required model tier: BUILDER-STRONG
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Risk: High (the new core domain object; the next-action invariant is the product spine)

## Why this first

P10-01 (Task atom + quick-add + Employee Today) is an umbrella. This sub-task is the
part that needs NO running stack, so it proceeds while the local Docker/Postgres/Redis
stack is being fixed. Quick-add API, the Employee Today screen, and runtime proof come
in P10-01B..D.

## Scope (~1-5 source files + tests; Prisma model/migration exempt from the budget)

- Generate a `tasks` module via the generator (do not hand-roll); fill MODULE.md.
- Task domain: title, owner, assignee, dueAt, status (Open/InProgress/Waiting/Done),
  nextAction {what, who, when}, polymorphic links[] (entityType + entityId for
  customer/vehicle/complaint/deal/employee), participant/visibility +
  confidentialityLevel primitives (so confidential cases are not a retrofit later).
- ENFORCE the next-action invariant in the service: an Open/InProgress/Waiting task
  MUST have a nextAction; Done/closed may clear it. Reject violations with the
  canonical AppException + a stable error code; write the change to audit in the same
  transaction. Reuse the existing assignment/audit patterns - do NOT rebuild them.

## Proof (no full stack required)

- corepack pnpm lint, typecheck, test
- Service/unit tests for the invariant: open-without-next-action rejected; status->Done
  clears it; audit recorded same-tx; allowed vs denied participant access.
- prisma validate on the new model; openapi:check if any route is added (keep minimal).
- Label any runtime/integration/web proof `Not Run` - deferred until the local stack is up.

## Exit

- Write P10-01B (10-second quick-add capture API) to next.md, or PLAN the rest of P10-01.
- Replace state.md (do not append).