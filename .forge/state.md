# Current State

Status: Search startup hotfix verified locally; production rollback is healthy
Phase: coordinated staff UI cutover
Next Task: Redeploy the hotfix artifact and verify production API/search health
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
- The hotfix now registers Prisma, auth, and guard providers and adds a
  CI-visible module-wiring regression test.
- Backend workflow authority, RBAC, branch scope, audit behavior, and customer
  portal privacy remain unchanged.
- Local lint, typecheck, OpenAPI, API, web, visual, accessibility, and static
  performance proofs pass.

## Current Stop

The hotfix is locally verified but not yet redeployed. Production remains on the
healthy rollback commit `68e27039` until the hotfix artifact passes health and
search smoke checks.

## Open Carry-Forward / Known Debt

- Run staging UAT and verify the agreed 5-second/10-second comprehension targets.
- Redeploy the hotfix and verify API health, login, global search, and dashboard
  requests before continuing UAT.
- Measure deployed LCP, INP, and CLS against existing p95 targets.
- Validate staging RBAC, localization, notification delivery, and rollback using
  the coordinated release artifact.
- Generated visual artifacts under `coverage/` remain intentionally unstaged.
