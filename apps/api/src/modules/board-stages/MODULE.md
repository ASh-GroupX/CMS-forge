---
type: forge.module
title: Board Stages Module
description: Agent context boundary for the board-stages backend module.
tags: [backend, module, agent-context]
---

# Board Stages Module

Agent context manifest. Read this before editing the module.

## Public surface

- `BoardStagesService` is the only service exported by `BoardStagesModule`.
- Admin CRUD for Kanban board columns (`docs/CMSS_REVAMP_PLAN.md` B1): list
  (staff read), create, rename/recolor, all-or-nothing reorder, and archive
  with a mandatory destination stage. Every mutation writes its CONFIG audit
  entry on the same transaction.
- TICKETS stages are mapped columns: each carries a `mappedComplaintStatus`
  and the complaint state machine is never bypassed here. TASKS stages may
  carry a `mappedTaskStatus` used by the task board move endpoint.

## Owns tables

- `board_stages` (the tasks module reads this table for its board and is the
  write path for `Task.stageId`; card reassignment on archive goes through
  `TasksBoardService.reassignStage`, never direct task-table writes here).

## May depend on

- `core/http-kernel` for Prisma and stable errors.
- `core/audit.service` for stage create/update/reorder/archive audit entries.
- `core/auth.guard` for RBAC (`MASTER_DATA_MANAGE` manage,
  `COMPLAINT_COMMENT_INTERNAL` staff read).
- `core/csrf.guard` for CSRF enforcement on mutation routes.
- `AuthService` through `AuthModule` for session validation guard wiring.
- `TasksBoardService` through `TasksModule` for same-transaction card
  reassignment when a TASKS stage is archived.
- Other modules' public services only. Never import another module repository,
  DTO folder, or Prisma model type.

## SRS

- REQ-ADMIN-001
- REQ-RBAC-001
- METHOD-MODULAR-001
- METHOD-AUDIT-001
- METHOD-API-001
- METHOD-TEST-001
