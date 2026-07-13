# Current State

Status: Search startup hotfix deployed and production health checks passed
Phase: coordinated staff UI cutover
Next Task: Run authenticated production smoke and employee/manager UAT
Model Tier: GPT-5.5 Extra High or Opus 4.8 Max

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Branch `codex/user-scoped-ux-redesign` is active.
- The staff shell now provides localized identity and branch scope, filtered
  navigation, global search, theme/language controls, and five-item mobile nav.
- The dashboard, queues, notifications, and collaboration composers use the new
  semantic visual system with Arabic RTL and English LTR parity.
- Additive API contracts provide branch labels, authorized global search,
  notification views/limits, and session-resolved complaint owner shortcuts.
- The first production promotion of `ca40feb1` exposed missing dependency
  registration in `SearchModule`; production was restored to `68e27039`.
- The first hotfix preflight safely found the guard's missing audit dependency
  before live replacement. The corrected hotfix registers the complete runtime
  graph and boots the Nest module in its CI regression test.
- Corrected artifact `c73cfdbc` passed isolated API startup, mapped `/search`,
  replaced the live API/web containers, and passed internal health plus external
  HTTPS checks.
- Backend workflow authority, RBAC, branch scope, audit behavior, and customer
  portal privacy remain unchanged.
- Local lint, typecheck, OpenAPI, API, web, visual, accessibility, and static
  performance proofs pass.

## Current Stop

The hotfix is deployed and infrastructure health checks pass. Authenticated
login, global search, dashboard smoke, employee/manager UAT, and deployed Web
Vitals remain release gates.

## Open Carry-Forward / Known Debt

- Run staging UAT and verify the agreed 5-second/10-second comprehension targets.
- Verify login, global search, and dashboard requests with an authenticated
  production session before continuing UAT.
- Measure deployed LCP, INP, and CLS against existing p95 targets.
- Validate staging RBAC, localization, notification delivery, and rollback using
  the coordinated release artifact.
- Generated visual artifacts under `coverage/` remain intentionally unstaged.
