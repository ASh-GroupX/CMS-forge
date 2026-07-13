---
type: forge.module
title: CommunicationGroups Module
description: Agent context boundary for the communication-groups backend module.
tags: [backend, module, agent-context]
---

# Communication Groups Module

Agent context manifest. Read this before editing the module. It defines the
module's boundary so you can work in a fresh context without scanning the tree.

## Public surface

- `CommunicationGroupsService` is the only export other modules may import.
- It owns personal/shared group lifecycle and resolves server-authorized mention
  targets. Complaint and task modules own their own comments and watchers.

## Owns tables

- `communication_groups`
- `communication_group_members`
- `users` (staff eligibility reads only)

## May depend on

- `core/*` (prisma, errors, audit, rbac, correlation).
- `modules/admin` public service for assignable staff scope checks.
- `modules/auth` public service for staff session guard wiring.
- Other modules' public services only. Never import another module repository,
  `dto/`, or Prisma model type.

## SRS

- REQ-COLLAB-001
- REQ-RBAC-001
- METHOD-AUDIT-001
- METHOD-MODULAR-001
