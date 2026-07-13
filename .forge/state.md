# Current State

Status: Full staff visual cutover passed locally; deployment pending
Phase: coordinated staff UI cutover
Next Task: Commit, deploy, and run authenticated multi-role production smoke
Model Tier: GPT-5.5 Extra High or Opus 4.8 Max

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Branch `codex/user-scoped-ux-redesign` is active with uncommitted redesign
  changes.
- Every staff route now renders inside the approved localized command-center
  shell; visual proofs no longer use a simplified shell-free wrapper.
- Shared workspace rules provide consistent card geometry, hairline surfaces,
  operational tables, and 40px desktop/44px mobile controls.
- Complaint detail now stacks at normal desktop widths and uses its two-column
  layout only on wide screens, preventing vertical text collapse.
- Dashboard, tasks, complaints, reports, groups, audit, and admin representative
  Arabic screenshots were inspected in the real shell.
- No backend workflow, RBAC, branch scope, audit, or portal behavior changed.
- Local lint, typecheck, web, visual, accessibility, and static performance
  proofs pass.

## Current Stop

Implementation and local proof are complete. Changes are not committed, pushed,
or deployed.

## Open Carry-Forward / Known Debt

- Commit and deploy after approval, then run authenticated production smoke.
- Validate employee, manager, and administrator data density in both locales.
- Measure deployed LCP, INP, and CLS.
- Generated visual artifacts under `coverage/` remain intentionally unstaged.
