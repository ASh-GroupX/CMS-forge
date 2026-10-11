---
type: forge.module
title: InternalTickets Module
description: Agent context boundary for the internal-tickets backend module.
tags: [backend, module, agent-context]
---

# InternalTickets Module

Agent context manifest. Read this before editing the module. It defines the
module's boundary so you can work in a fresh context without scanning the tree.

## Public surface

- `InternalTicketsService` is the only export other modules may import.

## Owns tables

- `internal_tickets`
- `ticket_notes`
- `ticket_activities`
- `ticket_ratings`
- `ticket_categories`
- `ticket_waiting_reasons`
- `ticket_sla_options`

## May depend on

- `core/*` (prisma, errors, audit, rbac, correlation).
- Other modules' public services only. Never import another module repository,
  `dto/`, or Prisma model type.

## SRS

- Add the requirement IDs this module implements before building behavior.
