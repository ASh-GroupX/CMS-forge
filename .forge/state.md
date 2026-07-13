# Current State

Status: Coordinated staff UI redesign implemented and locally verified
Phase: coordinated staff UI cutover
Next Task: Deploy the redesign artifact to staging and run employee/manager UAT
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
- Backend workflow authority, RBAC, branch scope, audit behavior, and customer
  portal privacy remain unchanged.
- Local lint, typecheck, OpenAPI, API, web, visual, accessibility, and static
  performance proofs pass.

## Current Stop

Implementation and local automated proof are complete. Staging deployment,
employee/manager UAT, and deployed Web Vitals remain release gates.

## Open Carry-Forward / Known Debt

- Run staging UAT and verify the agreed 5-second/10-second comprehension targets.
- Measure deployed LCP, INP, and CLS against existing p95 targets.
- Validate staging RBAC, localization, notification delivery, and rollback using
  the coordinated release artifact.
- Generated visual artifacts under `coverage/` remain intentionally unstaged.
