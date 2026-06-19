---
type: forge.module
title: Notifications Module
description: Agent context boundary for the notifications backend module.
tags: [backend, module, agent-context]
---

# Notifications Module

Agent context manifest. Read this before editing the module.

## Public surface

- `NotificationsService` is the only service exported by `NotificationsModule`.
- This module owns queued notification persistence. Provider delivery, templates,
  workers, routes, and SLA integration are added only by their scoped tasks.
  Email dispatch uses the `IntegrationsService` public provider boundary.

## Owns tables

- `notifications`
- `notification_templates`

## May depend on

- `core/http-kernel` for `PrismaService` and later stable API errors.
- `modules/integrations` public service for provider adapter dispatch.
- Other modules' public services only. Never import another module repository,
  DTO folder, or Prisma model type.

## SRS

- REQ-NOTIFY-001
- REQ-SLA-001
- SLA-CALENDAR-001
- ARCH-WORKFLOW-001
- METHOD-AUDIT-001
- METHOD-TEST-001
- API-STANDARD-001
