---
type: forge.module
title: Search Module
description: Agent context boundary for the search backend module.
tags: [backend, module, agent-context]
---

# Search Module

Agent context manifest. Read this before editing the module. It defines the
module's boundary so you can work in a fresh context without scanning the tree.

## Public surface

- `SearchService` is the only export other modules may import.

## Owns tables

- `complaints` (read-only search projection)
- `tasks` (read-only search projection)
- `cases` (read-only search projection)
- `deals` (read-only search projection)
- `customers` (read-only search projection)

## May depend on

- `core/*` (prisma, errors, audit, rbac, correlation).
- `modules/auth` public services for session authentication.
- Other modules' public services only. Never import another module repository,
  `dto/`, or Prisma model type.

## SRS

- REQ-SEARCH-001
- API-STANDARD-001
- METHOD-TEST-001
