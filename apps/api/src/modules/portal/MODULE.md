---
type: forge.module
title: Portal Module
description: Agent context boundary for the portal backend module.
tags: [backend, module, agent-context]
---

# Portal Module

Agent context manifest. Read this before editing the module.

## Public surface

- `PortalService` is the only service exported by `PortalModule`.
- This module owns customer portal submission, verification, and portal-session
  behavior. Public routes, complaint submission, OTP handling, tracking reads,
  notifications, attachments, and UI are added only by their scoped tasks.

## Owns tables

- `portal_verifications`
- `portal_sessions`

## May depend on

- `core/http-kernel` for stable API errors and request context.
- `core/audit.service` for portal verification/security audit entries.
- `core/rate-limit.guard` for public portal abuse protection.
- Other modules' public services only. Never import another module repository,
  DTO folder, or Prisma model type.

## SRS

- REQ-PORTAL-001
- REQ-PORTAL-002
- PORTAL-SEC-001
- REQ-NOTIFY-001
- REQ-SURVEY-001
- ARCH-WORKFLOW-001
- METHOD-AUDIT-001
- METHOD-TEST-001
