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

## Owns tables

- `tasks`
- `task_links`
- `task_participants`
- `task_comments`
- `task_status_history`

## May depend on

- `core/http-kernel` for Prisma and stable errors.
- `core/audit.service` for task mutation audit.
- `AuthModule` / `AuthService` for staff session guard wiring on task routes.
- `modules/admin` / `AdminUsersService` public surface for assignable staff scope checks.
- `NotificationsService` public surface for task nudge/comment in-app rows.
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
