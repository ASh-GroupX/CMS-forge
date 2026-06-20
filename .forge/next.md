# Build Task: P10-01D - Employee Today Screen And Runtime Proof

Status: Ready to Build
Required model tier: BUILDER-STRONG
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Risk: Medium

## Context

The local stack blocker is repaired enough to resume `[stack]` Phase 10 work.
Production remains deferred. Use the local runtime only.

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

Build the Employee Today staff screen against the existing P10-01C API/read model.
Keep this as the smallest useful slice:

1. Staff route/screen for Employee Today.
2. Typed web API client call for the Employee Today read model if it does not
   already exist.
3. Render due today, overdue, assigned to me, waiting on me, and escalated task
   sections from real API data.
4. Preserve Arabic RTL / English LTR labels and loading / empty / error states.
5. Add focused web/runtime proof.

## Guardrails

- Do not add workflow builders, AI, WhatsApp, mobile app, or new design systems.
- Do not invent business/workflow authority in React. The API owns task visibility.
- Reuse the existing staff shell, design tokens, and shadcn/Radix primitives.
- Keep the task to 1-5 files plus focused tests. If it grows, stop and replan.

## Acceptance

- Employee Today screen shows only tasks visible to the signed-in employee.
- Empty/error/loading states are safe and localized.
- Arabic and English render without mojibake.
- Runtime smoke against the local API/web passes.
- Evidence records exactly what ran.

## Proof Commands

- `$env:DATABASE_URL='postgres://cms_auto:cms_auto_dev@localhost:5433/cms_auto'; corepack pnpm db:seed`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test:web -- shell`
- Browser/runtime smoke at `http://localhost:4000`
