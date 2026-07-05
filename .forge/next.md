# UI/UX Refactor - Slice 6 Admin, Reports, Audit, and Notifications

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: ui-ux-redesign
Risk: Medium
SRS IDs: `ARCH-UI-001`, `UI-SCREEN-001`, `UI-DESIGN-001`, `QA-UI-001`, `REQ-LOCALIZATION-001`, `REQ-ADMIN-001`, `REQ-REPORT-001`, `REQ-AUDIT-001`, `METHOD-AUDIT-001`
Skills: `ui-ux-pro-max`, `redesign`, `design-qa`, `design-taste-frontend` supporting anti-slop only

## Task

Continue the CMS-Auto UI/UX refactor after the complaint detail/workflow slice.
Migrate the operational admin, reports, audit, and notification surfaces onto the
shared primitives without changing backend authority, route contracts, RBAC,
branch scope, audit, report scoping, notification privacy, or portal behavior.

## Scope

- Migrate admin tables/forms to shared states, fields, badges, and semantic tokens.
- Refine reports hierarchy around one primary metric, supporting metrics, report
  catalog, scoped filters, and scoped export affordances.
- Keep audit viewer dense, searchable, backend-redacted, and export-scoped.
- Make notifications clearly show unread/read state and scoped complaint links.
- Use the shared primitives from Slice 2 where they fit.
- Keep all data from existing typed API helpers; do not add hardcoded data or
  frontend RBAC/report/audit authority.
- Use semantic tokens and shrink raw color usage where touched.
- Keep UI copy in dictionaries and preserve Arabic RTL plus English LTR.

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

- Admin tables/forms use shared states and fields where appropriate.
- Reports show clear hierarchy, scoped filters, catalog, and scoped export
  affordances.
- Audit remains dense, searchable, and backend-redacted.
- Notifications clearly distinguish unread/read and preserve scoped complaint
  links.
- No production route behavior, OpenAPI contract, RBAC, branch scope, audit,
  report scoping, notification privacy, or portal privacy rule changes.
- No new UI dependency is introduced.
