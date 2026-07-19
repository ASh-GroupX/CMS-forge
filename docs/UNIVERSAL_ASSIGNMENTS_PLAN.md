# Universal Assignment and Forwarding Plan

Status: complete on implementation branch `nour`; awaiting human review
Risk: High (RBAC, branch/department scope, workflow, audit, notifications, data migration)
SRS: `REQ-RBAC-001`, `REQ-COLLAB-001`, `REQ-WORKFLOW-002`,
`REQ-SEARCH-001`, `REQ-REPORT-001`, `REQ-AUDIT-001`,
`REQ-LOCALIZATION-001`, `RBAC-MATRIX-001`, `METHOD-MODULAR-001`,
`METHOD-AUDIT-001`, `METHOD-API-001`, `METHOD-TEST-001`, `UI-DESIGN-001`

## Objective

Introduce an additive, reusable assignment aggregate that supports a user, a
department, or both for every assignable record. Keep domain workflow authority
inside the owning module and keep all existing assignment columns operational
until compatibility is proven.

## Domain mapping

- Tasks and customer promises: `Task` (`isCustomerPromise` is a task subtype).
- Complaints: `Complaint`.
- Leads and dealership handoffs: `Deal`.
- Requests and operational cases: `Case`.
- Future entities: a stable string `entityType` plus `entityId`; adoption does
  not require copying assignment business rules.

## Locked design decisions

1. `assignments` stores the current assignment; `assignment_history` is
   append-only forwarding history.
2. A database check requires at least one of `assigned_user_id` or
   `assigned_department_id`.
3. Domain records retain their legacy assignment columns. Domain services
   dual-write the legacy fields and generic assignment in the same transaction.
4. Existing rows are backfilled idempotently. No destructive column removal is
   part of this plan.
5. The generic module validates active users/departments and server-derived
   branch scope. The owning domain service still decides whether the actor may
   assign that record.
6. Assignment history and the append-only audit entry commit with the domain
   write. Notification work is queued only after commit.
7. Complaint assignment remains part of legal backend workflow transitions;
   the generic module never changes complaint status.
8. Reads, filters, dashboards, and reports continue to use compatible domain
   projections while generic assignment becomes the shared write model.
9. Arabic RTL and English LTR use one reusable assignment control built from
   existing shadcn primitives.

## Phases

### A — Foundation

- [x] A1: Prisma models, constraints, indexes, additive legacy-column changes,
  and idempotent backfill migration.
- [x] A2: Generate the `assignments` module from the repository generator and
  fill its manifest/DTO boundary.
- [x] A3: Implement assignment validation, current/history writes, audit, scoped
  option reads, and allowed/denied tests.
- [x] A4: Register the module and document its read/options contract in OpenAPI.

### B — Tasks and promises

- [x] B1: Make the task assignee compatible with department-only assignment;
  dual-write create/update paths and preserve next-action rules.
- [x] B2: Update task queue/board/promise/manager projections, filters,
  permissions, and assignment notifications.
- [x] B3: Add the reusable frontend assignment control to task create/edit and
  board flows with EN/AR states and compatibility tests.

### C — Complaints

- [x] C1: Dual-write complaint workflow routing/investigation assignment,
  allowing user, department, or both without bypassing transitions.
- [x] C2: Update complaint queue/board/detail/search/report projections and
  owner/department filters.
- [x] C3: Reuse the frontend assignment control in workflow forms; prove RBAC,
  conflict, audit, notifications, EN/AR, and portal privacy.

### D — Leads and requests

- [x] D1: Add department-compatible assignment to Deals (Leads), dual-write
  create/handoff/update, and preserve stage authority/task creation.
- [x] D2: Add department-compatible assignment to Cases (Requests), dual-write
  create/update, and preserve confidentiality/participant access.
- [x] D3: Update the deal handoff and case screens with the reusable assignment
  control and scoped options.

### E — Proof and migration handoff

- [x] E1: Verify filters, dashboards, reports, notifications, audit history,
  and backward-compatible API shapes across all adopted entities.
- [x] E2: Run migration test, index check, API/web/unit tests, OpenAPI drift,
  lint, typecheck, visual, accessibility, and targeted E2E proof.
- [x] E3: Review EN/AR screenshots, append evidence/security self-check, and
  document rollout/rollback steps. Do not merge or push to protected branches.

## Migration and rollback rules

- Forward migration creates generic tables first, relaxes only assignment
  columns required for department-only records, adds new department columns,
  then backfills.
- Deploy code capable of dual-read/dual-write before considering removal of any
  legacy field. Legacy-field removal is explicitly out of scope.
- Rollback keeps legacy fields populated by dual-write. Dropping the additive
  generic tables is optional only after confirming no new department-only row
  lacks a legacy user fallback; otherwise roll forward with a repair migration.
