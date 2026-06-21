---
type: forge.module
title: Cases Module
description: Agent context boundary for the cases backend module.
tags: [backend, module, agent-context]
---

# Cases Module

Agent context manifest. Read this before editing the module. It defines the
module's boundary so you can work in a fresh context without scanning the tree.

## Public surface

- `CasesService` is the only export other modules may import.
- This module owns additive Case draft, link, and timeline behavior for Phase 10.

## Owns tables

- `cases`
- `case_links`
- `case_participants`
- `case_restricted_notes`
- `case_lifecycle_history`
- `complaint_status_history` (read-only timeline projection for linked complaint cases)
- `capa_actions`

## May depend on

- `core/*` (prisma, errors, audit, rbac, correlation).
- `AuthService` through `AuthModule` for session validation guard wiring.
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
