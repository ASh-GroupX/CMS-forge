---
type: forge.module
title: Assignments Module
description: Generic current assignment, forwarding history, scoped options, and audit boundary.
tags: [backend, module, assignment, forwarding, agent-context]
---

# Assignments Module

## Public surface

- `AssignmentsService` is the only export other modules may import.
- Owning domain services authorize the record and keep workflow authority.
- Domain services call `setInTransaction` with their transaction so legacy
  fields, assignment history, and audit commit atomically.
- `GET /assignments/options` returns server-session-scoped active users and
  departments for reusable frontend assignment controls.

## Owns tables

- `assignments`
- `assignment_history`
- `users`, `departments`, and `branches` are read-only reference data.

## May depend on

- `core/http-kernel` for Prisma and stable errors.
- `core/audit.service` for append-only assignment audit.
- `AuthModule` / `AuthService` for server-session guard wiring.
- `NotificationsModule` / `NotificationsService` for post-commit assignment notifications.
- Other modules' public services only. Never import another module repository,
  DTO folder, or Prisma model type.

## SRS

- REQ-RBAC-001
- REQ-COLLAB-001
- REQ-WORKFLOW-002
- REQ-AUDIT-001
- RBAC-MATRIX-001
- METHOD-MODULAR-001
- METHOD-AUDIT-001
- METHOD-API-001
- METHOD-TEST-001
