---
type: forge.module
title: Reports Module
description: Agent context boundary for the reports backend module.
tags: [backend, module, agent-context]
---

# Reports Module

Agent context manifest. Read this before editing the module.

## Public surface

- `ReportsService` is the only service exported by `ReportsModule`.
- This scaffold intentionally has no report behavior yet. Dashboard reads,
  filtered report reads, scoped exports, RBAC, branch scope, and export audit
  begin in later F7-01 tasks.

## Owns tables

- None yet. Reporting reads other modules' data; F7-01B decides the declared
  cross-module read boundary before any query behavior is added.

## May depend on

- `core/*` for shared backend kernel services when behavior is added.
- `AuthService` through `AuthModule` for session validation guard wiring.
- `ComplaintsService` through `ComplaintsModule` for complaint reporting reads.
- `SlaService` through `SlaModule` for SLA warning and overdue reporting reads.
- `SurveysService` through `SurveysModule` for survey reporting reads if kept in
  pilot scope.
- Other modules' public services only. Never import another module repository,
  `dto/`, or Prisma model type.

## SRS

- REQ-REPORT-001
- METHOD-MODULAR-001
