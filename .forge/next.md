# Full Staff Visual Cutover

Status: Web runtime hotfix ready; visual cutover deployment pending
Required model tier: GPT-5.5 Extra High or Opus 4.8 Max
Phase: coordinated staff UI cutover
Risk: High
SRS IDs: `REQ-LOCALIZATION-001`, `REQ-RBAC-001`, `UI-SCREEN-001`,
`UI-DESIGN-001`, `METHOD-TEST-001`

## Task

Deploy and smoke-test the approved command-center design across all staff
routes. The dashboard, tasks, complaints, complaint detail, notifications,
reports, groups, audit, and administration now share the same authenticated
shell, surface treatment, operational density, control sizing, and responsive
behavior.

## Verification

- Passed: `corepack pnpm lint` and `corepack pnpm typecheck`.
- Passed: `corepack pnpm test:web` (213/213).
- Passed: `corepack pnpm test:visual` (100 full-shell route previews).
- Passed: `corepack pnpm web:visual-review`; representative Arabic tasks,
  complaints, complaint detail, reports, groups, and admin screens inspected.
- Passed: `corepack pnpm test:e2e -- accessibility` (22 route previews).
- Passed: `corepack pnpm web:perf` (5 static route previews).
- Inspected: `coverage/web-visual-review/ar-complaint-detail-final.png` after
  correcting the narrow-column collapse found during visual review.

## Required Human Gates

- Needs Human Review: deploy the web runtime hotfix and confirm the isolated
  container plus live web health before production UI smoke.
- Needs Human Review: authenticated Arabic/English production smoke across
  employee, manager, and administrator roles.
- Needs Human Review: representative production data density and deployed Web
  Vitals.
