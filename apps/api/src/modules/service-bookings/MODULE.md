---
type: forge.module
title: ServiceBookings Module
description: Agent context boundary for service center bookings, timeline, and capacity rules.
tags: [backend, module, agent-context]
---

# ServiceBookings Module

Agent context manifest for the service center booking module.

## Public surface

- `ServiceBookingsService` and `ServiceBookingsExportService` are the public
  services other modules may import. The export service returns a safe, bounded
  appointment page for an integration key's branch scope.

## Owns tables

- `service_appointments`
- `service_booking_rules`
- `service_car_models`
- `service_centers`
- `service_maintenance_types`
- `service_booking_sms_settings`
- `audit_logs`

## May depend on

- `core/*` (prisma, errors, audit, rbac, correlation).
- `modules/branches`
- `modules/auth`
- `modules/notifications` (SMS adapter dispatch through NotificationsService)

## SRS

- SR-BOOK-001 (Service Center appointment calendar timeline)
- SR-BOOK-002 (Slot capacity, 15-minute resolution, hourly and daily booking rules)
- SR-BOOK-003 (Multi-branch view and branch name management)
- SR-BOOK-004 (Master data for car models and maintenance types)
- REQ-BOOK-SMS-001 (Admin-configured service appointment SMS reminders)
- REQ-INT-DATA-001 (Scoped external appointment reads)
