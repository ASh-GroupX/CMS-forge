# User-Scoped UX Redesign - Slice 8

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: user-scoped-ux-redesign
Risk: High
SRS IDs: REQ-REPORT-001, REPORT-MATRIX-001, RBAC-MATRIX-001, REQ-LOCALIZATION-001, UI-SCREEN-001, UI-DESIGN-001, NFR-SEC-002

## Task

Make reports honest and scoped.

## Scope

- Re-read Slice 8 in `docs/USER_SCOPED_UX_REDESIGN_PLAN.md`.
- Inspect the reports page, reports dashboard, export proxy, typed clients, OpenAPI, and existing reports API/e2e/web tests before editing.
- Add required filters: date range, branch, category, severity, owner, and where available department.
- Disable export until real scoped data is loaded.
- Show delivered/deferred report status plainly.
- Ensure export uses the same scoped filters as the view.
- Ensure report export creates an audit entry with filters and row count.
- Do not move report authorization, branch scope, export limits, audit, complaint state, portal privacy, workflow, or attachment authority into React.

## Proof

- `corepack pnpm test:api -- reports`
- `corepack pnpm test:e2e -- reports`
- `corepack pnpm test:web -- api-client`
- `corepack pnpm openapi:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `git diff --check`
