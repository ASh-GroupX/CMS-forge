# User-Scoped UX Redesign - Slice 5

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: user-scoped-ux-redesign
Risk: High
SRS IDs: REQ-COMPLAINT-001, REQ-COMPLAINT-002, REQ-LOCALIZATION-001, UI-SCREEN-001, UI-DESIGN-001, NFR-SEC-002

## Task

Make complaint detail understandable.

## Scope

- Re-read Slice 5 in `docs/USER_SCOPED_UX_REDESIGN_PLAN.md`.
- Inspect the complaint detail workspace, comments panel, typed detail client, API response shape, and existing shell/localization/visual tests before editing.
- Show role-safe customer and vehicle data from the API.
- If a field is redacted, show the reason.
- Put status, SLA, owner, severity, and next action in the header area.
- Separate public customer updates from internal comments.
- Use locale-aware dates instead of raw timestamps.
- Do not move complaint state, authorization, workflow, branch scope, portal privacy, audit, or attachment authority into React.

## Proof

- `corepack pnpm test:api -- complaints`
- `corepack pnpm test:web -- localization`
- `corepack pnpm test:visual`
- `corepack pnpm openapi:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `git diff --check`
