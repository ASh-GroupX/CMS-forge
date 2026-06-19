---
type: forge.module
title: Surveys Module
description: Agent context boundary for the surveys backend module.
tags: [backend, module, agent-context]
---

# Surveys Module

Agent context manifest. Read this before editing the module.

## Public surface

- `SurveysService` is the only service exported by `SurveysModule`.
- This module owns survey link and response behavior. Scheduling, portal
  submission routes, staff result read models, and report integration are added
  only by their scoped tasks.

## Owns tables

- `surveys`

## May depend on

- `core/http-kernel` for `PrismaService` and stable API errors.
- `modules/auth` public service for staff read route session guards.
- `modules/notifications` public service for survey link notification flow.
- `modules/complaints` public service for authorized complaint context only.
- Other modules' public services only. Never import another module repository,
  `dto/`, or Prisma model type.

## SRS

- REQ-SURVEY-001
- REQ-NOTIFY-001
- METHOD-TEST-001
- API-STANDARD-001
