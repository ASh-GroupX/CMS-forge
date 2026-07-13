# Current State

Status: Arabic UX 90+ implementation and local proof complete; human gates open
Phase: collaboration UX repair
Next Task: Run Arabic usability UAT and deployed performance validation
Model Tier: GPT-5.5 Extra High or Opus 4.8 Max

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Branch `codex/user-scoped-ux-redesign` is active.
- Complaint detail now separates immediate work, communication, and supporting
  details while keeping the complaint summary and next action above the tabs.
- The shared audience picker explains assignee, mention, and CC; performs
  server-scoped delayed search; displays current watchers; preserves drafts; and
  handles exact large-audience confirmation without client-side recipient logic.
- Public updates remain explicit, customer-facing, and confirmation-gated.
- Task conversations expose localized context and linked complaints. Group
  management exposes existing groups first, clear states, confirmed
  deactivation, and focus restoration.
- Desktop and mobile navigation now prioritize the routes used for daily work.
- Backend authority, OpenAPI compatibility, RBAC, branch scope, workflow,
  transactionality, audit, recipient expansion, and portal privacy remain intact.
- Passed local proof: typecheck, lint, OpenAPI, migration sanity, focused API and
  collaboration service tests, 213 shell tests, 11 localization tests, 58 web
  API-client tests, 82 visual previews, 82 visual-review artifacts, 22
  accessibility previews, and 5 static performance previews.
- Representative Arabic screenshots at 390, 430, 768, 1024, and 1440px were
  inspected with no page overflow, clipped labels, incoherent overlap, or broken
  RTL hierarchy in the covered surfaces.

## Current Stop

Implementation and local automated proof are complete. A score of 90+ is not yet
claimed because the approved release gate requires real Arabic user sessions and
deployed Core Web Vitals telemetry.

## Open Carry-Forward / Known Debt

- Run two low-tech Arabic validation sessions, then final UAT with two customers,
  two employees, and two managers.
- Measure deployed LCP under 2.5s, INP under 200ms, and CLS under 0.1. Local
  static performance previews do not prove these field metrics.
- The audit append-only database proof was skipped because Docker is unavailable.
- Apply the additive migration, seed/activate collaboration templates, and
  validate notification provider behavior before pilot release.
- Exact Slice 11 compensation still needs signed deferral or approved metadata.
- Remaining report requirements still need their recorded deferrals or outputs.
- The off-token color lint ratchet remains at 33 matches.
- Generated proof artifacts under `coverage/` and `.playwright-cli/` remain
  intentionally unstaged.
