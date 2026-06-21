---
type: forge.module
title: Admin Module
description: Agent context boundary for the admin backend module.
tags: [backend, module, agent-context]
---

## Public surface

- `AdminUsersService` is the public staff-user management service.

## Owns tables

- `users`
- `roles`
- `branches`

## May depend on

- `core/audit.service` for admin user create/deactivate/reactivate audit entries.
- `core/auth.guard` for Admin-only RBAC on HTTP routes.
- `core/csrf.guard` for CSRF enforcement on admin mutation routes.
- `core/http-kernel` for Prisma and stable errors.
- `AuthService` through `AuthModule` for session validation guard wiring.
- Other modules' public services only. Never import another module repository,
  DTO folder, or Prisma model type.

## SRS

- REQ-ADMIN-001
- REQ-RBAC-001
- METHOD-AUDIT-001
- METHOD-API-001
- METHOD-TEST-001
