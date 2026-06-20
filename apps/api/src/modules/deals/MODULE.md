---
type: forge.module
title: Deals Module
description: Agent context boundary for the deals backend module.
tags: [backend, module, agent-context]
---

# Deals Module

Agent context manifest. Read this before editing the module. It defines the
module's boundary so you can work in a fresh context without scanning the tree.

## Public surface

- `DealsService` is the only export other modules may import.
- This module owns Deal stage-gate authority for Phase 10 dealership handoffs.

## Owns tables

- `deals`

## May depend on

- `core/*` (prisma, errors, audit, rbac, correlation).
- `AuthModule` / `AuthService` for staff session guard wiring on deal routes.
- `TasksModule` / `TasksService` for generating next-holder tasks from deal
  transitions.
- Other modules' public services only. Never import another module repository,
  `dto/`, or Prisma model type.

## SRS

- REQ-RBAC-001
- NFR-SEC-002
- REQ-REPORT-001
- METHOD-MODULAR-001
- METHOD-API-001
- METHOD-TEST-001
- NFR-MAINT-001
