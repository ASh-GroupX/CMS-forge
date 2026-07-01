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

Related tables may be read or coordinated through their owning modules once
those modules exist: `comments`, `attachments`, `approvals`, `sla_events`,
`notifications`, `portal_verifications`, `portal_sessions`, `compensation`,
`customers`, `vehicles`, `branches`, `categories`, and `departments`.

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
