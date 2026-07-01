# User-Scoped UX Redesign - Slice 9

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: user-scoped-ux-redesign
Risk: High
SRS IDs: REQ-LOCALIZATION-001, UI-SCREEN-001, UI-DESIGN-001, NFR-SEC-002

## Task

Arabic, accessibility, and responsive cleanup.

## Scope

- Re-read Slice 9 in `docs/USER_SCOPED_UX_REDESIGN_PLAN.md`.
- Inspect touched components and i18n dictionaries from Slices 1-8 before editing.
- Use Arabic labels and option names in Arabic screens.
- Use locale-aware date/time formatting.
- Verify 390px, 430px, 768px, 1024px, 1280px, and 1440px.
- Add clear unavailable-action reasons where an action is visible but blocked.
- Keep focus order logical in RTL and LTR.
- Do not move RBAC, branch scope, workflow, portal privacy, report/export, DMS, or attachment authority into React.

## Proof

- `corepack pnpm test:web -- localization`
- `corepack pnpm test:e2e -- accessibility`
- `corepack pnpm test:visual`
- `corepack pnpm web:perf`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `git diff --check`
