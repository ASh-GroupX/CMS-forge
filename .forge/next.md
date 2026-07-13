# Arabic UX 90+ Repair

Status: Implementation Complete; Human UAT Pending
Required model tier: GPT-5.5 Extra High or Opus 4.8 Max
Phase: collaboration UX repair
Risk: High
SRS IDs: `REQ-COLLAB-001`, `REQ-COMMENTS-001`, `REQ-RBAC-001`,
`REQ-NOTIFY-001`, `REQ-LOCALIZATION-001`, `PORTAL-SEC-001`,
`API-STANDARD-001`, `METHOD-AUDIT-001`

## Task

Make Arabic complaint and task collaboration understandable and safe for
low-technology staff:

- Separate complaint work, communication, and details into three focused tabs.
- Explain assignee, mention, CC, and public customer updates before users act.
- Preserve server-returned collaboration capabilities, watcher state, audience
  thresholds, exact confirmation counts, and recipient limits.
- Provide one server-scoped audience picker for complaint and task updates.
- Complete task conversation, communication-group management, grouped desktop
  navigation, five-item mobile navigation, and Arabic error/empty/loading states.
- Keep backend workflow, RBAC, branch scope, recipient resolution, audit, and
  portal privacy authoritative and unchanged.

## Verification

- Passed: `corepack pnpm typecheck`.
- Passed: `corepack pnpm lint`.
- Passed: `corepack pnpm openapi:check`.
- Passed: `corepack pnpm db:migrate:test`.
- Passed: focused groups, complaints, tasks, notifications, RBAC, portal, and
  API-level audit tests.
- Passed: `corepack pnpm test:web -- shell` (213/213).
- Passed: `corepack pnpm test:web -- localization` (11/11).
- Passed: `corepack pnpm test:web -- api-client` (58/58).
- Passed: `corepack pnpm test:visual` (82 route previews).
- Passed: `corepack pnpm web:visual-review` (82 HTML/PNG artifacts).
- Passed: `corepack pnpm test:e2e -- accessibility` (22 route previews).
- Passed: `corepack pnpm web:perf` (5 static route previews).

## Required Human Gates

- Needs Human Review: two low-tech Arabic users must distinguish assignee,
  mention, CC, and public customer updates using the scripts in
  `docs/ARABIC_UX_90_REPAIR.md`.
- Needs Human Review: final UAT with two customers, two employees, and two
  managers must meet the approved completion and comprehension thresholds.
- Needs Human Review: collect deployed LCP, INP, and CLS telemetry. The local
  performance proof validates render/static budgets, not field Web Vitals.
- Needs Human Review: run the Docker-backed audit append-only proof, apply the
  additive migration, activate templates, and validate provider delivery in
  staging before pilot release.
