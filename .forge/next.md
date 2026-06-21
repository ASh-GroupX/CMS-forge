# Build Task: P10-02B - Manager Control Room Screen And Web Proof

Status: Ready to Build
Required model tier: BUILDER-STRONG
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Risk: Medium

## Context

P10-01D is complete locally. Employee Today is live at `/tasks/today` and the
local stack is usable for the remaining Phase 10 `[stack]` screens.

Current local stack:

- Docker compose project: `cms-forge-local`
- Postgres container: `cms-forge-local-postgres-1`
- Redis container: `cms-forge-local-redis-1`
- Host `DATABASE_URL`: `postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto`
- Host `REDIS_URL`: `redis://localhost:6379`
- API: `http://localhost:3000`
- Web: `http://localhost:4000`

Host port `5432` is occupied by the Windows PostgreSQL service, so use `5433`
for host-side Prisma/API work unless that service is later stopped.

## Scope

Build the Manager Control Room staff screen against the existing P10-02A
`GET /tasks/manager-rollup` API/read model.

Keep this as the smallest useful slice:

1. Manager/admin staff route and navigation entry for Manager Control Room.
2. Typed web API client for the manager rollup read model if one does not exist.
3. Render overdue-by-employee, due today, stuck tasks, workload by assignee,
   escalated tasks, overdue promises, and promise KPI from real API data.
4. Preserve Arabic RTL / English LTR labels and loading / empty / error states.
5. Add focused web/runtime proof.

## Guardrails

- Do not add workflow builders, AI, WhatsApp, mobile app, or new design systems.
- Do not invent manager authority in React. The API owns role and branch scope.
- Reuse the existing staff shell, design tokens, and shadcn/Radix primitives.
- Keep the task to 1-5 files plus focused tests. If it grows, stop and replan.
- Do not expose confidential HR-only task/case details beyond the API response.

## Acceptance

- Manager Control Room appears only for manager/admin-capable roles.
- Employee/basic staff cannot access the route or see manager navigation.
- Rollup sections render from the signed-in manager/admin API session.
- Empty/error/loading states are safe and localized.
- Runtime smoke against the local API/web passes.
- Evidence records exactly what ran.

## Proof Commands

- `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm db:seed`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test:web -- shell`
- Browser/runtime smoke at `http://localhost:4000`
