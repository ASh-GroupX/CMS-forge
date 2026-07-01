# User-Scoped UX Redesign - Slice 4

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: user-scoped-ux-redesign
Risk: High
SRS IDs: REQ-COMPLAINT-001, REQ-COMPLAINT-002, RBAC-MATRIX-001, REQ-LOCALIZATION-001, UI-SCREEN-001, UI-DESIGN-001, NFR-SEC-002

## Task

Simplify staff home, queue, and mobile navigation.

## Scope

- Re-read Slice 4 in `docs/USER_SCOPED_UX_REDESIGN_PLAN.md`.
- Inspect the staff layout, dashboard, complaints queue, work queue component, typed queue clients, and existing shell/e2e/visual/perf tests before editing.
- Make mobile staff navigation put main work content first with a compact header/menu and skip-to-main.
- Make queue search, filters, and pagination URL-backed and API-backed using existing typed patterns.
- Default queue to the server/session-scoped "mine or allowed branch scope" behavior; do not add client authority.
- Replace raw IDs with human labels where visible and improve empty-state guidance.

## Proof

- `corepack pnpm test:web -- shell`
- `corepack pnpm test:e2e -- work-queues`
- `corepack pnpm test:e2e -- accessibility`
- `corepack pnpm test:visual`
- `corepack pnpm web:perf`
- `corepack pnpm openapi:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `git diff --check`
