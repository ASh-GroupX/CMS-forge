# Current State

Date: 2026-11-18
Status: Department ticket dashboard drill-down complete; release pending
Risk: High

- The internal manager dashboard now shows only department-received and
  department-sent ticket cards; unrelated KPI/filter/performance UI is removed.
- Counts and destination lists use the department from the authenticated server
  session and exclude tickets still awaiting sender approval.
- Both cards open the matching filtered internal-ticket board in English/Arabic.
- Passed internal-tickets API 12/12, reports API 47/47, web 249/249, typecheck,
  lint, OpenAPI, security, diff, and EN/AR browser/Axe proof. Screenshots inspected.
- Production deployment and signed-in live card drill-down are Not Run.
- The Amman periodic live preflight remains untouched: 69 ready, 59 already
  imported, 0 review. No production booking was created in this task.
- Preserve untracked `outputs/`, `tmp/`, and `uploads/`.
