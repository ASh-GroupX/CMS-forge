---
type: forge.module
title: Departments Module
description: Agent context boundary for the departments backend module.
tags: [backend, module, agent-context]
---

# Departments Module

Agent context manifest. Read this before editing the module.

## Public surface

- `DepartmentsService` is the only service exported by `DepartmentsModule`.
- This module is the golden CRUD reference for Admin configuration modules:
  controller = HTTP/auth/request parsing, service = validation/business rules,
  repository = owned-table Prisma access, and mutation audit entries share the
  write transaction.

## Owns tables

- `departments`
- `standard_problems`

## May depend on

- `core/http-kernel` for Prisma and stable errors.
- `core/audit.service` for department create/update/deactivate audit entries.
- `core/auth.guard` for Admin-only RBAC on HTTP routes.
- `core/csrf.guard` for CSRF enforcement on department mutation routes.
- `AuthService` through `AuthModule` for session validation guard wiring.
- Other modules' public services only. Never import another module repository,
  DTO folder, or Prisma model type.

## SRS

- REQ-ADMIN-001
- METHOD-MODULAR-001
- METHOD-AUDIT-001
- METHOD-API-001
- NFR-MAINT-001
- METHOD-TEST-001
