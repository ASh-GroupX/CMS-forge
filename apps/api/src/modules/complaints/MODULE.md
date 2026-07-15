---
type: forge.module
title: Complaints Module
description: Agent context boundary for the complaints backend module.
tags: [backend, module, agent-context]
---

# Complaints Module

Agent context manifest. Read this before editing the module.

## Public surface

- `ComplaintsService` is the primary exported service.
- `ComplaintsBoardService` serves the session-scoped ticket Kanban read
  (`GET /complaints/board`): TICKETS columns from `board_stages`, complaints
  scoped by the same queue rules, and per-card `allowedTransitions` derived from
  the backend workflow (never a client state machine).
- `ComplaintFormOptionsService` is exported only for form option catalogs; public
  callers must use `listPublic()` so staff-only department and scope metadata is
  not exposed.
- This module owns complaint lifecycle behavior: creation, backend-owned
  workflow transitions, complaint read models, and same-transaction status
  history plus audit writes.
- This shell is behavior-free until the F2 workflow and complaint tasks fill in
  service, repository, controller, DTO, and tests.

## Owns tables

- `complaints`
- `complaint_relations`
- `complaint_status_history`
- `complaint_reference_sequences`
- `complaint_watchers`

Related tables may be read or coordinated through their owning modules once
those modules exist: `comments`, `attachments`, `audit_logs`, `approvals`, `sla_events`,
`notifications`, `portal_verifications`, `portal_sessions`, `compensation`,
`customers`, `vehicles`, `branches`, `categories`, and `departments`.
`board_stages` is read-only here for ticket board columns (write ownership lives
in the `board-stages` module).

## May depend on

- `core/http-kernel` for Prisma and stable errors.
- `core/audit.service` for complaint creation and workflow audit entries.
- `core/auth.guard` for server-session-derived roles and branch scope.
- `core/csrf.guard` for session-authenticated mutation routes.
- AuthService through AuthModule for session validation guard wiring.
- NotificationsService through NotificationsModule for workflow notifications.
- SlaService through SlaModule for workflow deadline events.
- CasesService through CasesModule for complaint-to-case wrapper creation and
  staff case summary reads.
- SurveysService through modules/surveys and SurveysModule for post-close
  satisfaction survey scheduling.
- TasksService through TasksModule for task-owned timeline facts on complaint
  detail.
- CommunicationGroupsService through CommunicationGroupsModule for
  server-scoped mention and watcher resolution.
- Other modules' public services only. Never import another module repository,
  DTO folder, or Prisma model type.

## SRS

- REQ-COMPLAINT-001
- ARCH-WORKFLOW-001
- WORKFLOW-MATRIX-001
- METHOD-AUDIT-001
- REQ-COMPLAINT-003
- METHOD-MODULAR-001
- METHOD-TEST-001
- NFR-MAINT-001
