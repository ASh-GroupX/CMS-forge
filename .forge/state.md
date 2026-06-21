# Current State

Status: Ready for Operator UX Foundation
Phase: Phase 11 - Operator UX Foundation
Next Task: P11A username login and Quick Add staff picker
Model Tier: GPT-5 High or Opus 4.8 Max

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- Phase 10 remains complete and release-reviewed.
- P10 Task Collaboration is complete locally:
  - Sent Tasks API and UI.
  - Task comments separate from complaint comments.
  - Manual task nudge with participant-recipient guard.
  - Task-linked in-app notification rows and current-user notification list.
  - OpenAPI canonical/generated contract updated.
- Remaining live browser proof passed with screenshots under `output/`:
  - User A created a task for User B.
  - User A saw it in `/tasks/sent`.
  - User A commented and nudged.
  - User B saw notification and task.
  - User B marked the task `DONE`.
  - User A saw updated status/comment.
  - Different-branch unrelated user was denied with `403`.
- Smoke-blocking bugfixes were limited to notification runtime wiring:
  - `NotificationsService` provider factory now receives repository,
    integrations, and audit dependencies.
  - `NotificationsController` explicitly injects `NotificationsService` for
    `GET /notifications`.
- Release review repaired the last RBAC audit gap in the new collaboration
  paths: object-level denied task comment/nudge access now records `SECURITY`
  audit.
- Proof passed:
  - `corepack pnpm test:api -- tasks`
  - `node --import tsx --test apps/api/src/modules/tasks/*.spec.ts`
  - `corepack pnpm test:api -- notifications`
  - `corepack pnpm test:web -- shell`
  - `corepack pnpm test:web -- localization`
  - `corepack pnpm openapi:check`
  - `corepack pnpm typecheck`
  - `corepack pnpm lint`
  - `git diff --check`
- New plan doc added: `docs/OPERATOR_UX_FOUNDATION_PLAN.md`.
- Next UX priority is making the app usable for non-technical dealership staff:
  username login, searchable pickers instead of raw IDs, and full Arabic
  localization for touched flows.

## Open carry-forward / known debt

- No P10 Task Collaboration carry-forward remains.
- Operator UX is not complete yet. Quick Add still has technical fields such as
  assignee ID and linked record ID; future slices must replace those with
  searchable, branch-scoped pickers.
- No admin screens, AI, WhatsApp, mobile, deploy, employee grievance screens, or
  workflow builder work was added.
- Promise Tracker still resolves customer/deal display context from task-boundary
  link IDs only. Add richer labels later through public customer/deal module
  services rather than direct cross-module repository reads.
- Departments, branch activation controls, category activation controls,
  severity/SLA policy, notification templates, and work queue query-param
  filtering remain previously known admin/search follow-ups.
