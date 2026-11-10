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

- `IntegrationsService` and `IntegrationApiKeyGuard` are the public surfaces
  exported by `IntegrationsModule`. `IntegrationsRepository` is exported only
  so Nest can construct the route guard in the importing module; consumers do
  not call it. External read routes use the guard and only their owning modules'
  public services for record reads.
- This module owns backend provider adapter boundaries and in-memory test doubles
  for external systems. The email provider port is available through
  `IntegrationsService`; the SMS provider port follows the same boundary-only
  pattern; the WhatsApp provider port is also boundary-only. The DMS lookup port
  exposes read-only customer/vehicle lookup outcomes with safe diagnostics and an
  in-memory disabled/manual pilot adapter. No live/test DMS provider, lookup
  telemetry persistence, provider SDK, credential, or writeback exists in this
  scope. Provider SDKs, credentials, writeback, durable delivery logging, routes,
  OpenAPI paths, schema changes, and UI are added only by their scoped tasks.

## Owns tables

- Provider adapter behavior is boundary-only.
- `integration_api_keys` stores only hashed, revocable read-only export keys and
  their explicit resource/branch scope. Raw secrets are returned once and never
  logged or persisted.

## May depend on

- `core/http-kernel` for stable API errors and future request context.
- `core/audit.service` for future provider call audit/security entries.
- `modules/auth` for staff-session validation on protected integration routes.
- `modules/branches` public service for validating selected active branch scopes.
- Other modules' public services only. Never import another module repository,
  `dto/`, or Prisma model type.

## SRS

- ARCH-INTEGRATION-001
- REQ-CUSTOMER-001
- DMS-MAP-001
- DATA-AUTO-001
- REQ-NOTIFY-001
- METHOD-API-001
- METHOD-TEST-001
- REQ-INT-DATA-001
