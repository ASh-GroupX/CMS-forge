# UI/UX Refactor - Slice 3 Staff Dashboard and Work Queue

Status: Ready
Required model tier: GPT-5.5 Extra High
Phase: ui-ux-redesign
Risk: Medium
SRS IDs: `ARCH-UI-001`, `UI-SCREEN-001`, `UI-DESIGN-001`, `QA-UI-001`, `REQ-LOCALIZATION-001`
Skills: `ui-ux-pro-max`, `redesign`, `design-qa`, `design-taste-frontend` supporting anti-slop only

## Task

Continue the CMS-Auto UI/UX refactor after the shared primitive slice. Make the
staff dashboard and work queue the primary operational accountability surfaces
without changing backend authority, route contracts, RBAC, branch scope, audit,
or portal behavior.

## Scope

- Make the work queue the primary operational surface for repeated staff work.
- Redesign the dashboard as a compact accountability summary, not an equal-weight
  decorative KPI grid.
- Keep these work queue signals visually prominent:
  SLA, severity, owner, branch, next action, age, and status.
- Use the shared primitives from Slice 2 where they fit; do not add broad new
  APIs or duplicate local badge/table/state wrappers.
- Keep filters URL-backed and preserve existing scoped API query behavior.
- Use semantic tokens and shrink raw color utility usage where touched.
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

- Dashboard and work queue use the shared primitives where useful and remain
  dense, scannable, and operational.
- Queue filters remain URL-backed and backend-scoped.
- Status/severity/SLA indicators use text plus token-backed non-color cues.
- No production route behavior, backend authority, workflow authority, RBAC,
  branch scope, audit, or portal privacy rule changes.
- No new UI dependency is introduced.
