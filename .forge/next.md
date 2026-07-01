# User-Scoped UX Redesign - Slice 7

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: user-scoped-ux-redesign
Risk: High
SRS IDs: REQ-COMPLAINT-001, REQ-COMPLAINT-002, REQ-LOCALIZATION-001, UI-SCREEN-001, UI-DESIGN-001, NFR-SEC-002

## Task

Complete related and duplicate complaint UX.

## Scope

- Re-read Slice 7 in `docs/USER_SCOPED_UX_REDESIGN_PLAN.md`.
- Inspect the related complaints panel, same-origin related complaint routes, typed relation API client, and existing API/e2e/web tests before editing.
- Show duplicate candidates with reference, customer, status, branch name, severity, and date.
- Add unlink with confirmation.
- Keep automatic destructive merge out of scope.
- Refresh the relation list after link/unlink.
- Do not move complaint state, authorization, branch scope, portal privacy, audit, workflow, duplicate matching authority, or attachment authority into React.

## Proof

- `corepack pnpm test:api -- complaints`
- `corepack pnpm test:e2e -- complaint-related`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm openapi:check` when API/contracts/routes changed
- `git diff --check`
