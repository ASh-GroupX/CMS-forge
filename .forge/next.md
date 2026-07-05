# UI/UX Refactor - Slice 8 Cleanup and Hardening

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: ui-ux-redesign
Risk: High
SRS IDs: `ARCH-UI-001`, `UI-SCREEN-001`, `UI-DESIGN-001`, `QA-UI-001`, `REQ-LOCALIZATION-001`, `PORTAL-SEC-001`
Skills: `ui-ux-pro-max`, `redesign`, `design-qa`, `design-taste-frontend` supporting anti-slop only

## Task

Continue the CMS-Auto UI/UX refactor after the customer portal slice. Remove
remaining production UI scaffolding and harden migrated surfaces without changing
backend authority, route contracts, RBAC, branch scope, audit, reports,
notifications, attachments, or portal privacy.

## Scope

- Remove remaining production `PreviewState` and query-state demo scaffolding
  where it is safe to do so.
- Remove fake modal semantics, empty `href`, and hardcoded user-facing English
  outside dictionaries.
- Shrink the raw color utility baseline in migrated surfaces.
- Confirm migrated screens still expose loading, empty, error, success, conflict,
  and destructive-confirm states where applicable.
- Keep visual-test fixtures as fixtures; do not move demo authority into
  production components.
- Preserve typed API helpers, route behavior, OpenAPI contracts, Arabic RTL, and
  English LTR.

## Proof

- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm test:visual`
- `corepack pnpm web:visual-review`
- `corepack pnpm test:e2e -- accessibility`
- `corepack pnpm web:perf`
- `git diff --check`

## Stop When

- No production `PreviewState` remains in migrated surfaces unless explicitly
  documented as test-only fixture code.
- No fake modal semantics, empty `href`, or new hardcoded user-facing English is
  present in touched UI.
- Raw color utility usage shrinks from the current ratcheted baseline where
  touched.
- No production route behavior, OpenAPI contract, portal privacy, attachment,
  verification, RBAC, branch scope, audit, report, or notification rule changes.
- No new UI dependency is introduced.
