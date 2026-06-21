# READY TO PLAN - PLAN-NEXT

Status: Ready to Plan
Required model tier: PLANNER
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Risk: TBD by planner
SRS IDs: TBD by planner

## Context

The accountability repair backlog is complete locally:

- P0 Tasks are operational.
- P1 Deals write flow is operational.
- P1 Customer Promise Tracker is operational.
- P2A Cases wrapper for complaints is operational.
- P2B Case CAPA is operational and the submit 500 repair is complete.
- P2C Product Framing is complete.

The final repair slice fixed the CAPA browser submit blocker, verified customer
portal privacy, verified unauthorized/different-branch CAPA denial, and reran
the full requested hardening matrix.

## Scope

Planner should choose the next narrow slice. Keep it explicit before build work
starts.

## Guardrails

- Do not rework complaint intake or customer portal behavior without a narrow
  task.
- Do not introduce production deploy, SMTP, WhatsApp, AI, mobile, HR-platform,
  VPS, admin expansion, employee grievance screens, or workflow builder work by
  default.
- Keep backend authority server-owned and keep source files under 300 lines.
- Preserve module boundaries. Cross-module labels need public module services,
  not direct cross-module repository reads.

## Suggested Planning Inputs

- Final hardening matrix passed locally for tasks, deals, cases, complaints,
  web shell/localization, OpenAPI, typecheck, lint, and diff whitespace.
- Live smoke passed for complaint intake -> linked `CUSTOMER_COMPLAINT` case,
  complaint detail Case Timeline, CAPA create, portal privacy, Promise Tracker,
  Deal Handoff Board advance, Today task action, and Manager Control Room name
  rendering.
- Known admin/search follow-ups still exist, but they are not automatically the
  next task for the deal workflow.

## Required Proof Commands

Planner must define proof commands for the selected slice. Typical local proof:

- `corepack pnpm test:api -- <area>`
- `corepack pnpm test:web -- shell`
- `corepack pnpm test:web -- localization`
- `corepack pnpm openapi:check`
- `corepack pnpm typecheck`
- `corepack pnpm lint`
- `git diff --check`
- Live smoke for any user-facing write path
