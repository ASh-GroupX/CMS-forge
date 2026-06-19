---
type: forge.module
title: Audit Module
description: Agent context boundary for the audit backend module.
tags: [backend, module, agent-context]
---

# Audit Module

## Public surface

- `AuditSearchService.search` supports staff audit-log search.

## Owns tables

- `audit_logs` read/search surface. Append-only writes stay in `core/audit.service.ts`.

## May depend on

- `core/http-kernel`
- `core/auth.guard`
- `core/audit.service`
- `modules/auth` public `AuthService`
- Prisma through this module's repository only

## SRS

- REQ-AUDIT-001
- NFR-SEC-002
- METHOD-AUDIT-001
- METHOD-API-001
- METHOD-TEST-001
- API-STANDARD-001
