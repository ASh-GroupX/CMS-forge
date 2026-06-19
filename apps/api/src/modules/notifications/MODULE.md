# Notifications Module

Agent context manifest. Read this before editing the module.

## Public surface

- `NotificationsService` is the only service exported by `NotificationsModule`.
- This module owns queued notification persistence. Provider delivery, templates,
  workers, routes, and SLA integration are added only by their scoped tasks.

## Owns tables

- `notifications`

## May depend on

- `core/http-kernel` for `PrismaService` and later stable API errors.
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
