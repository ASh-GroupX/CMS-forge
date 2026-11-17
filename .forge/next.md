# Internal ticket context and dashboard drill-down

Status: Complete locally; release pending
Date: 2026-11-17
Risk: High
SRS: REQ-NOTIFY-001, REQ-REPORT-001, REQ-RBAC-001, METHOD-AUDIT-001, UI-DESIGN-001

Scope is delivered as three small proof slices so each remains reviewable:

1. Show the saved waiting, resolution, and rejection explanation on the full
   internal-ticket page, and preserve a human-readable reason snapshot in new
   status-history entries.
2. After commit, enqueue deduplicated in-app notifications to the ticket's
   creator, assignee/requested employee, and active target-department staff when
   a ticket is created or receives a note; never notify the actor.
3. Turn dashboard justification and satisfaction summary cards into scoped
   complaint-list drill-down links backed by validated API filters.

Proof: focused internal-ticket, complaint/report, and web tests; typecheck,
lint, OpenAPI drift check; English and Arabic Playwright screenshot review.

Result: Passed internal-tickets 11/11, complaints 103/103, web shell 244/244,
focused queue/UI 2/2, typecheck, lint, OpenAPI, security, diff check, and the
English/Arabic hydrated browser proof. Screenshots were inspected. Production
deployment and signed-in live UAT are pending the repository release.

Do not change legacy ticket records, complaint workflow authority, role grants,
branch scope, or portal exposure. Preserve untracked `outputs/`, `tmp/`, and
`uploads/`.
