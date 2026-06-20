# Blocked Task: Restore Local Stack For Phase 10 Stack Tasks

Status: Blocked
Required model tier: BUILDER-STRONG
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Risk: High (runtime proof blocked)

## Blocker

The remaining Phase 10 tasks are `[stack]` tasks:

- P10-01D Employee Today screen/runtime proof
- P10-02B Manager Control Room screen/web test
- P10-03B worker reminder/escalation wiring
- P10-04D Deal Handoff Board screen/web test
- P10-07B KPI dashboard screen/web test
- P10-09C confidential HR-only screens/privacy regression
- P10-10B end-to-end local proof

Local stack prerequisite is unresolved: Docker/Postgres/Redis are down or not
usable, dev DB creds need repair, and C: disk is critically low.

## Smallest Repair

Human repair:

1. Free enough C: disk for Docker/Postgres/runtime artifacts.
2. Start Docker Desktop and the project Postgres/Redis stack.
3. Fix local Postgres dev credentials so Prisma can authenticate.
4. Run migrations and `corepack pnpm db:seed`.

## Resume

After repair, resume AUTO PHASE at the first remaining `[stack]` Phase 10 task.
