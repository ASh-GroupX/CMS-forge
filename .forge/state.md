# Current State

Status: Ready for Next Slice Planning
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Next Task: PLAN-P1-NEXT
Model Tier: PLANNER

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- P0 Tasks are operational and live-smoked from the prior slice.
- P1-DEALS-WRITE is complete. Deal create, advance, and blocker writes are
  backend-owned, RBAC and branch scoped, audited in the same transaction, and
  documented in OpenAPI.
- P1-CUSTOMER-PROMISE-TRACKER is complete. `GET /tasks/promises` returns
  session-authorized, branch-scoped customer promises linked to customer, deal,
  case, or complaint records.
- The Promises staff page is wired into main navigation and shows open,
  overdue, and kept-on-time KPIs plus owner, assignee, next-action, due-date,
  customer, and deal context where available.
- Quick Add blocks customer promises that do not include a customer, deal, case,
  or complaint link.
- Local runtime is active: API on `http://localhost:3000`, web on
  `http://localhost:4000`, Docker Postgres on host port `5433`, and Redis on
  `6379`.
- P2 cases, CAPA, production deploy, SMTP, WhatsApp, AI, mobile, HR-platform,
  and VPS work remain explicitly untouched.

## Open carry-forward / known debt

- The next repair slice needs planner selection. Do not infer P2 case/CAPA work
  from this state file.
- Promise Tracker currently resolves customer/deal display context from
  task-boundary link IDs only. Add richer labels later through public
  customer/deal module services rather than direct cross-module repository
  reads.
- Departments, branch activation controls, category activation controls,
  severity/SLA policy, notification templates, and work queue query-param
  filtering remain previously known admin/search follow-ups.
- Windows service `postgresql-x64-16` still owns host port 5432; keep using 5433
  for this local Docker database unless the service is stopped with admin
  rights.
