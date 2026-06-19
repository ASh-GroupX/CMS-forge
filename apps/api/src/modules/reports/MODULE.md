---
type: forge.module
title: Reports Module
description: Agent context boundary for the reports backend module.
tags: [backend, module, agent-context]
---

# Reports Module

Agent context manifest. Read this before editing the module. It defines the
module's boundary so you can work in a fresh context without scanning the tree.

## Public surface

- `ReportsService` is the only export other modules may import.

## Owns tables

- `reports` (verify before adding behavior).

## May depend on

- `core/*` (prisma, errors, audit, rbac, correlation).
- Other modules' public services only. Never import another module repository,
  `dto/`, or Prisma model type.

## SRS

- Add the requirement IDs this module implements before building behavior.
