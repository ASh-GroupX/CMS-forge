---
type: forge.module
title: SLA Module
description: Agent context boundary for the sla backend module.
tags: [backend, module, agent-context]
---

# SLA Module

Agent context manifest. Read this before editing the module.

## Public surface

- `SlaService` is the only service exported by `SlaModule`.
- This module owns SLA policy calculation and SLA event behavior. HTTP routes,
  workers, notifications, and persistence are added only by their scoped tasks.

## Owns tables

- `sla_policies`
- `sla_events`

## May depend on

- `core/http-kernel` for stable API errors.
- `core/audit.service` for later SLA recalculation or policy-change audit entries.
- `NotificationsService` through `NotificationsModule` for warning/breach notification queueing.
- Other modules' public services only. Never import another module repository,
  DTO folder, or Prisma model type.

## SRS

- REQ-SLA-001
- SLA-CALENDAR-001
- ARCH-WORKFLOW-001
- METHOD-AUDIT-001
- METHOD-TEST-001
- API-STANDARD-001
