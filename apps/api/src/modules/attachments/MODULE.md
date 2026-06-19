---
type: forge.module
title: Attachments Module
description: Agent context boundary for the attachments backend module.
tags: [backend, module, agent-context]
---

# Attachments Module

Agent context manifest. Read this before editing the module.

## Public surface

- `AttachmentsService` is the only service exported by `AttachmentsModule`.
- This module owns attachment metadata boundaries for complaint files. Upload,
  download, object storage, malware scanning, authorization rules, OpenAPI paths,
  and UI are added only by their scoped tasks.

## Owns tables

- `attachments`

## May depend on

- `core/http-kernel` for `PrismaService`, stable API errors, and request context.
- `core/audit.service` for future attachment access audit entries.
- `core/auth.guard` for future staff route session/RBAC enforcement.
- ComplaintsService through ComplaintsModule for complaint ownership and scope
  checks when attachment behavior is added.
- Other modules' public services only. Never import another module repository,
  DTO folder, or Prisma model type.

## SRS

- ARCH-FILES-001
- REQ-FILES-001
- REQ-PORTAL-001
- REQ-PORTAL-002
- METHOD-AUDIT-001
- METHOD-API-001
- METHOD-TEST-001
