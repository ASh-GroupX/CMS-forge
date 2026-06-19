---
type: forge.module
title: Branches Module
description: Agent context boundary for the branches backend module.
tags: [backend, module, agent-context]
---

# Branches Module

Agent context manifest. Read this before editing the module.

## Public surface

- `BranchesService` is the only service exported by `BranchesModule`.
- This module is the golden CRUD reference for Admin configuration modules:
  controller = HTTP/auth/request parsing, service = validation/business rules,
  repository = owned-table Prisma access, and mutation audit entries share the
  write transaction.

## Owns tables

- `branches`

## May depend on

- `core/http-kernel` for Prisma and stable errors.
- `core/audit.service` for branch create/update/deactivate audit entries.
- `core/auth.guard` for Admin-only RBAC on HTTP routes.
- `core/csrf.guard` for CSRF enforcement on branch mutation routes.
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
