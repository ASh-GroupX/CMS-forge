# UI/UX Refactor - Slice 2 Shared UI Primitives

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: ui-ux-redesign
Risk: Medium
SRS IDs: `ARCH-UI-001`, `UI-SCREEN-001`, `UI-DESIGN-001`, `QA-UI-001`, `REQ-LOCALIZATION-001`
Skills: `ui-ux-pro-max`, `redesign`, `design-qa`, `design-taste-frontend` supporting anti-slop only

## Task

Continue the CMS-Auto UI/UX refactor after the shared staff and portal shell
slice. Build the smallest useful shared UI primitives that current screens can
consume without a whole-app rewrite.

## Scope

- Add or consolidate shared primitives only where the current screens need them:
  `PageHeader`, `StateBlock`, `Field`, `ActionDialog`, `FilterBar`,
  `DataTable`, `StatusBadge`, `MetricStrip`, `Timeline`, and
  `AttachmentDropzone`.
- Use existing shadcn/Radix/Lucide/Tailwind primitives and semantic tokens.
- Add only the props required by current migrated screens; no speculative
  component APIs.
- Keep UI copy in dictionaries and preserve Arabic RTL plus English LTR.
- Preserve backend authority, route contracts, RBAC, branch scope, audit,
  portal privacy, and OpenAPI behavior.

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

- Shared primitives exist only where they remove real duplication for upcoming
  screen migrations.
- No production route behavior, backend authority, workflow authority, RBAC,
  branch scope, audit, or portal privacy rule changes.
- No new UI dependency is introduced.
- The off-token color ratchet does not increase beyond the current baseline.
