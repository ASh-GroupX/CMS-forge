---
type: forge.module
title: Customers Module
description: Agent context boundary for the customers backend module.
tags: [backend, module, agent-context]
---

# Customers Module

Agent context manifest. Read this before editing the module. It defines the
module's boundary so you can work in a fresh context without scanning the tree.

## Public surface

- `CustomersService` is the only export other modules may import.

## Owns tables

- `customers` (verify before adding behavior).

## May depend on

- `core/*` (prisma, errors, audit, rbac, correlation).
- `modules/auth`
- Other modules' public services only. Never import another module repository,
  `dto/`, or Prisma model type.

## SRS

- Add the requirement IDs this module implements before building behavior.
