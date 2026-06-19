---
type: forge.module
title: Auth Module
description: Agent context boundary for the auth backend module.
tags: [backend, module, agent-context]
---

# Auth Module

Agent context manifest. Read this before editing the module.

## Public surface

- `AuthService` is the only service exported by `AuthModule`.

## Owns tables

- `users`
- `staff_sessions`

## May depend on

- `core/http-kernel` for Prisma and stable errors.
- `core/audit.service` for auth audit entries.
- `core/auth.guard` for session/RBAC guard wiring.
- `core/csrf.guard` for CSRF enforcement.
- `core/rate-limit.guard` for login throttling.
- Other modules' public services only. Never import another module repository,
  DTO folder, or Prisma model type.

## SRS

- CONTRACT-READINESS-002
- ARCH-AUTH-001
- REQ-AUTH-001
- NFR-SEC-001
- API-STANDARD-001
- METHOD-TEST-001