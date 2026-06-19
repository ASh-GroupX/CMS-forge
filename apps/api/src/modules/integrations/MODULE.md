---
type: forge.module
title: Integrations Module
description: Agent context boundary for the integrations backend module.
tags: [backend, module, agent-context]
---

# Integrations Module

Agent context manifest. Read this before editing the module. It defines the
module's boundary so you can work in a fresh context without scanning the tree.

## Public surface

- `IntegrationsService` is the only service exported by `IntegrationsModule`.
- This module owns backend provider adapter boundaries and in-memory test doubles
  for external systems. The email provider port is available through
  `IntegrationsService`; the SMS provider port follows the same boundary-only
  pattern; the WhatsApp provider port is also boundary-only. Provider SDKs,
  credentials, dispatch behavior, delivery logging, routes, OpenAPI paths,
  schema changes, and UI are added only by their scoped tasks.

## Owns tables

- None yet. Provider adapter behavior in this phase is boundary-only until a
  scoped persistence task adds owned tables.

## May depend on

- `core/http-kernel` for stable API errors and future request context.
- `core/audit.service` for future provider call audit/security entries.
- Other modules' public services only. Never import another module repository,
  `dto/`, or Prisma model type.

## SRS

- ARCH-INTEGRATION-001
- REQ-NOTIFY-001
- METHOD-API-001
- METHOD-TEST-001
