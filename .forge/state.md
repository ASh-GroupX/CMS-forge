# Current State

Status: Web runtime hotfix verified locally; visual deployment pending
Phase: coordinated staff UI cutover
Next Task: Deploy the web runtime hotfix, then run multi-role production smoke
Model Tier: GPT-5.5 Extra High or Opus 4.8 Max

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Branch `codex/user-scoped-ux-redesign` contains visual cutover commit
  `fa267b23`; its first web preflight stopped before live replacement because
  Corepack attempted a runtime pnpm download.
- The web image now starts the already-installed Next executable directly with
  Node, removing the runtime registry dependency.
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

Implementation and local proof are complete. Production still runs the previous
healthy web image because the failed preflight stopped before live replacement.

## Open Carry-Forward / Known Debt

- Deploy the web runtime hotfix, then run authenticated production smoke.
- Validate employee, manager, and administrator data density in both locales.
- Measure deployed LCP, INP, and CLS.
- Generated visual artifacts under `coverage/` remain intentionally unstaged.
