---
type: forge.module
title: PortalIntake Module
description: Agent context boundary for the portal-intake backend module.
tags: [backend, module, agent-context]
---

# PortalIntake Module

Agent context manifest. Read this before editing the module. It defines the
module's boundary so you can work in a fresh context without scanning the tree.

## Public surface

- `PortalIntakeService` is the only export other modules may import.

## Owns tables

- `portal_intake_settings`
- `portal_intake_members`
- `portal_intake_forms`

## May depend on

- `core/*` (prisma, errors, audit, rbac, correlation).
- modules/admin public AdminUsersService for eligible active configuration choices and transactional target validation.
- modules/auth public AuthService for server session validation.
- modules/service-bookings public ServiceBookingsService for the active vehicle catalog.
- Other modules' public services only. Never import another module repository,
  `dto/`, or Prisma model type.

## SRS

- REQ-ADMIN-001
- REQ-PORTAL-001
- REQ-RBAC-001
- METHOD-AUDIT-001
