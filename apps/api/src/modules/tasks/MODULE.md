---
type: forge.module
title: Tasks Module
description: Agent context boundary for the tasks backend module.
tags: [backend, module, agent-context]
---

# Tasks Module

Agent context manifest. Read this before editing the module. It defines the
module's boundary so you can work in a fresh context without scanning the tree.

## Public surface

- `TasksService` is the only export other modules may import.
- This module owns the Task atom: next-action invariant, task links, participant
  visibility primitives, and task mutation audit.
- `TasksBoardService` serves the session-scoped Kanban read (`GET /tasks/board`)
  inside this module; it is not exported to other modules.

## Owns tables

- `tasks`
- `task_links`
- `task_participants`
- `task_comments`
- `task_status_history`
- `task_comment_mentions`
- `board_stages` (read-only here for task board columns; write ownership moves to
  the `board-stages` module in Phase B)
- `departments` (read-only shared reference data: B3 department-assignment
  validation and the board's assignment options — never written here)

## May depend on

- `core/http-kernel` for Prisma and stable errors.
- `core/audit.service` for task mutation audit.
- `AuthModule` / `AuthService` for staff session guard wiring on task routes.
- `modules/admin` / `AdminUsersService` public surface for assignable staff scope checks.
- `NotificationsService` public surface for task nudge/comment in-app rows.
- `CommunicationGroupsService` public surface for server-scoped collaboration
  targets and recipient resolution.
- Other modules' public services only. Never import another module repository,
  `dto/`, or Prisma model type.

## SRS

- ARCH-UI-001
- UI-DESIGN-001
- UI-SCREEN-001
- METHOD-MODULAR-001
- METHOD-AUDIT-001
- METHOD-TEST-001
- NFR-MAINT-001
