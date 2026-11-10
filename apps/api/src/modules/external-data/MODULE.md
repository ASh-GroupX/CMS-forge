---
type: forge.module
title: ExternalData Module
description: Agent context boundary for the external-data backend module.
tags: [backend, module, agent-context]
---

# ExternalData Module

Agent context manifest. Read this before editing the module. It defines the
module's boundary so you can work in a fresh context without scanning the tree.

## Public surface

- `ExternalDataService` coordinates four owning modules' public export services.

## Owns tables

- None. This module reads only through owning modules' public services.

## May depend on

- `core/*` (prisma, errors, audit, rbac, correlation).
- `modules/integrations` public API-key guard.
- `modules/customers`, `modules/complaints`, `modules/tasks`, and
  `modules/service-bookings` public services.
- Other modules' public services only. Never import another module repository,
  `dto/`, or Prisma model type.

## SRS

- REQ-INT-DATA-001
