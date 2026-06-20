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

- None as write owner.
- Read-only reporting boundary: `tasks` and `task_status_history` may be read
  to derive event-based KPI aggregates. Reports must not write these tables.
- Read-only reporting boundary: `complaints`, `complaint_status_history`,
  `sla_events`, and `cases` may be read to derive complaint/case KPI aggregates.
  Reports must not write these tables.

## May depend on

- `core/*` for shared backend kernel services when behavior is added.
- `core/http-kernel` for `PrismaService` in read-only report repositories.
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
