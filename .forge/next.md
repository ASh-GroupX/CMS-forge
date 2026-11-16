# Current role capability release

Status: Complete; release pending
Date: 2026-11-16
Risk: High
SRS: REQ-RBAC-001, REQ-ADMIN-001, METHOD-AUDIT-001, UI-DESIGN-001

Scope: CR manager and officer actions use assignable server-session permissions across complaint intake and workflow, task oversight, deal handoffs, cases, assignments, search, report exports, and the related staff controls. Existing built-in role grants are preserved through an audited migration; custom roles can receive the same capabilities. Admin Hub groups and explains permissions in English and Arabic. Identity-only built-in navigation defaults, SLA recipients, and role labels remain role based.

Proof: Passed auth API 41/41, admin 46/46, RBAC 2/2, portal 32/32, internal tickets 8/8, search 5/5, reports 46/46, tasks 46/46, deals 9/9, cases 29/29, assignments 9/9, complaints 101/101, web 243/243, English/Arabic permission browser proof, lint, typecheck, OpenAPI, security check. The full database migration and signed-in live role UAT are Not Run locally because Docker is unavailable.
