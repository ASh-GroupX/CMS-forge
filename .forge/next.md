# Coordinated Staff UI Redesign

Status: Search Startup Hotfix Deployed; Production UAT Pending
Required model tier: GPT-5.5 Extra High or Opus 4.8 Max
Phase: coordinated staff UI cutover
Risk: High
SRS IDs: `REQ-SEARCH-001`, `REQ-LOCALIZATION-001`, `REQ-RBAC-001`,
`REQ-NOTIFY-001`, `REQ-COLLAB-001`, `REQ-COMMENTS-001`,
`API-STANDARD-001`, `METHOD-TEST-001`

## Task

Ship the approved staff redesign from `docs/MODERN_UI_REDESIGN.md` as one
coordinated shell and workflow update while preserving backend authority, RBAC,
branch scope, audit behavior, and portal privacy.

The first production promotion of `ca40feb1` failed because `SearchModule` did
not register its runtime dependencies. Production was rolled back successfully
to `68e27039`; the first hotfix preflight found the remaining audit dependency
before live replacement. Corrected artifact `c73cfdbc` is now deployed and
healthy; continue with authenticated production smoke and UAT.

## Verification

- Passed: `corepack pnpm lint`, `corepack pnpm typecheck`, and
  `corepack pnpm openapi:check`.
- Passed: auth (38/38), complaint/workflow (77/77), search hotfix (5/5), and
  notification API suites.
- Passed: `corepack pnpm test:web` (213/213).
- Passed: `corepack pnpm test:visual` and `corepack pnpm web:visual-review`
  (82 route previews and rendered artifacts).
- Passed: `corepack pnpm test:e2e -- accessibility` (22 route previews).
- Passed: `corepack pnpm web:perf` (5 static route previews).
- Passed in production: isolated API startup, `/search` route mapping, live API
  health, API/web container recreation, and external HTTPS reachability for
  `c73cfdbc`.

## Required Human Gates

- Needs Human Review: verify login, global search, and the staff dashboard with
  an authenticated production session.
- Needs Human Review: employee and manager staging UAT against the agreed
  role/scope, urgent-item, and collaboration-comprehension thresholds.
- Needs Human Review: deployed LCP, INP, and CLS telemetry; the local proof does
  not establish field performance.
- Needs Human Review: final production acceptance after authenticated smoke and
  employee/manager UAT.
