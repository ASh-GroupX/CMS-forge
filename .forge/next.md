# Department ticket dashboard drill-down

Status: Complete
Date: 2026-11-18
Risk: High
SRS: REQ-RBAC-001, UI-DESIGN-001

Simplify the internal-operations manager dashboard to the department ticket
flows the user needs and make every summary card open its exact ticket list.

Scope:

1. Show only department-sent and department-received ticket cards for managers;
   remove completion, KPI, filter, export, and employee-rating dashboard noise.
2. Scope counts to the signed-in manager's server-session department rather than
   the whole branch.
3. Make each card open the internal-ticket board with the matching department
   flow selected in English and Arabic.
4. Keep department scope enforced by the existing authenticated backend route
   and prove the links, filtering, RTL/LTR render, accessibility, and checks.

The separate Amman periodic import remains paused at its confirmed live preflight:
69 ready, 59 already imported, 0 review. Do not create those appointments without
a new action-time confirmation.
