# Current State

Status: Accountability Repair Backlog Complete
Phase: Phase 10 - Dealership Accountability Layer (local-first)
Next Task: PLAN-NEXT
Model Tier: PLANNER

## How to use this file

SNAPSHOT only. REPLACE each run, never append. Per-task detail -> evidence.md.
Prior state history is in .forge/archive/state-archive.md.

## Snapshot

- P0 Tasks are operational and live-smoked.
- P1-DEALS-WRITE is complete. Deal create, advance, and blocker writes are
  backend-owned, RBAC and branch scoped, audited in the same transaction, and
  documented in OpenAPI.
- P1-CUSTOMER-PROMISE-TRACKER is complete. `GET /tasks/promises` returns
  session-authorized, branch-scoped customer promises linked to customer, deal,
  case, or complaint records.
- P2A-CASES-WRAPPER-FOR-COMPLAINTS is complete. New complaints create or link a
  `CUSTOMER_COMPLAINT` case in the same transaction, and staff users can read
  `GET /cases/:caseId/timeline`.
- P2B-CASE-CAPA is complete and repaired. The browser CAPA create blocker was
  traced to undefined `AuditService` injection in `CsrfGuard`; explicit runtime
  injection/factory wiring fixed the 500. Browser smoke now returns 201,
  renders the new CAPA row, resets the form, and shows success without
  save-error.
- P2C-PRODUCT-FRAMING is complete. The staff shell/dashboard use dealership
  accountability language, the main nav emphasizes Today, Promises, Deals,
  Cases, and Reports, and complaint wording remains inside complaint
  intake/detail contexts.
- Final hardening matrix passed locally: tasks/deals/cases/complaints API
  suites, direct tasks/deals/cases specs, web shell/localization, OpenAPI,
  typecheck, lint, and `git diff --check`.

## Open carry-forward / known debt

- No active accountability repair blocker remains.
- Promise Tracker currently resolves customer/deal display context from
  task-boundary link IDs only. Add richer labels later through public
  customer/deal module services rather than direct cross-module repository
  reads.
- Case Timeline and CAPA resolve case branch and owner names where the cases
  boundary already owns that projection. Add richer linked-entity labels later
  through public module services rather than direct cross-module repository
  reads.
- Departments, branch activation controls, category activation controls,
  severity/SLA policy, notification templates, and work queue query-param
  filtering remain previously known admin/search follow-ups.
