# Build Task: P9-03A - Initialize Shadcn Config

Status: Ready to Build
Required model tier: BUILDER-STANDARD
Phase: Phase 9 - Production Readiness (Pilot on Hostinger)
Risk: Medium
Requirements: UI-DESIGN-001 AC1, UI-DESIGN-001 AC2

## Goal

Create the shadcn/ui project contract with the shadcn CLI so later tasks can add
primitives without hand-rolling component structure.

## Scope

Expected files: 1-5.

Allowed:
- `apps/web/components.json`
- `apps/web/package.json` if the CLI updates dependencies
- `pnpm-lock.yaml` if dependencies change
- `apps/web/tailwind.config.ts` if the CLI updates paths/theme hooks
- `apps/web/src/globals.css` if the CLI updates CSS variable hooks

Do not add `apps/web/src/components/ui/*` in this task. Do not refactor screens.
`apps/web/src/lib/utils.ts` already exists; keep it unless the CLI requires a
conflict repair.

## Build Steps

- From `apps/web`, run the shadcn init command non-interactively:
  `corepack pnpm dlx shadcn@latest init --yes`.
- Keep the generated config pointed at:
  - CSS: `src/globals.css`
  - Tailwind config: `tailwind.config.ts`
  - components alias: `@/components`
  - UI alias: `@/components/ui`
  - utils alias: `@/lib/utils`

## Acceptance

- `apps/web/components.json` exists and uses the existing Next.js/Tailwind app
  paths.
- No shadcn primitive files are added yet.
- Existing web smoke, accessibility, lint, and typecheck still pass.
- No business/workflow authority moves into React.

## Proof Commands

- `corepack pnpm test:e2e -- ui-smoke`
- `corepack pnpm test:e2e -- accessibility`
- `corepack pnpm lint`
- `corepack pnpm typecheck`

## On Success

- Append evidence for P9-03A only.
- Mark P9-03A done in `.forge/backlog.md`.
- Write P9-03B as the next task.
- Replace `.forge/state.md` with a short `Ready to Build` snapshot.
