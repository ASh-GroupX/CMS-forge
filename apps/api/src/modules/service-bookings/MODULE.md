---
type: forge.module
title: ServiceBookings Module
description: Agent context boundary for service center bookings, timeline, and capacity rules.
tags: [backend, module, agent-context]
---

# ServiceBookings Module

Agent context manifest for the service center booking module.

## Public surface

- `ServiceBookingsService` is the only export other modules may import.

## Owns tables

- `service_appointments`
- `service_booking_rules`
- `service_car_models`
- `service_centers`
- `service_maintenance_types`

## May depend on

- `core/*` (prisma, errors, audit, rbac, correlation).
- `modules/branches`
- `modules/auth`

## SRS

- SR-BOOK-001 (Service Center appointment calendar timeline)
- SR-BOOK-002 (Slot capacity, 15-minute resolution, hourly and daily booking rules)
- SR-BOOK-003 (Multi-branch view and branch name management)
- SR-BOOK-004 (Master data for car models and maintenance types)
