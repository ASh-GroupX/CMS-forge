# READY TO PLAN - PLAN-P1-NEXT

Status: Ready to Plan
Required model tier: PLANNER
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Risk: Medium
SRS IDs: TBD by planner

## Context

P0 Tasks, P1 Deals write flow, and P1 Customer Promise Tracker are complete and
live-smoked.

Completed P1 customer promise surface:

- `GET /tasks/promises`
- Staff Promises navigation/page
- Open promise, overdue promise, and kept-on-time KPI summary
- Promise list with owner, assignee, next action, due date, and linked
  customer/deal context where available
- Quick Add validation requiring a customer, deal, case, or complaint link for
  customer promises

## Scope

Planner should choose the next narrow repair slice. Keep it small and explicit
before build work starts.

## Guardrails

- Do not implement P2 case/CAPA work unless the planner explicitly selects it.
- Do not introduce production deploy, SMTP, WhatsApp, AI, mobile, HR-platform,
  VPS, admin expansion, or workflow builder work by default.
- Keep backend authority server-owned and keep source files under 300 lines.
- Preserve module boundaries. Rich customer/deal promise labels need public
  module services, not direct cross-module repository reads.

## Suggested Planning Inputs

- P0 Tasks: operational and live-smoked.
- P1 Deals write flow: operational and live-smoked.
- P1 Customer Promise Tracker: operational and live-smoked.
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
- Live browser smoke for any user-facing write path
