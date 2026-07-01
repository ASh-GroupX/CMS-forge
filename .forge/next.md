# User-Scoped UX Redesign - Slice 2

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: user-scoped-ux-redesign
Risk: High
SRS IDs: REQ-COMPLAINT-001, REQ-COMPLAINT-002, UI-SCREEN-001, UI-DESIGN-001, NFR-SEC-002, RBAC-MATRIX-001

## Task

Make staff workflow actions real.

## Scope

- Re-read Slice 2 in `docs/USER_SCOPED_UX_REDESIGN_PLAN.md`.
- Inspect current complaint detail route, workflow modal, staff complaint API client, backend transition response shape, and related tests before editing.
- Render only backend-allowed workflow actions for the current user/session.
- Submit action comments/confirmation to the backend transition endpoint.
- Handle success, validation, and conflict feedback without moving workflow authority into React.

## Proof

- `corepack pnpm test:api -- complaints`
- `corepack pnpm test:e2e -- complaint-workflow`
- `corepack pnpm test:e2e -- accessibility`
- `corepack pnpm openapi:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `git diff --check`
