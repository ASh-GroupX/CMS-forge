# Custom role navigation and view defaults

Status: Complete; production deployment verified
Date: 2026-11-16
Risk: High
SRS: REQ-RBAC-001, RBAC-MATRIX-001, UI-DESIGN-001, METHOD-AUDIT-001

Scope: Add role-selectable view presets and page visibility permissions for new and existing custom roles. Resolve defaults from the server session when a user has no personal override. Preserve built-in role navigation and permission grants. Use existing audited, versioned role permission writes and CSRF guards. Prove allowed and denied role edits, session claims, EN/AR role form behavior, accessibility, and push.

Proof: Passed auth API 41/41, admin API 45/45, RBAC 2/2, web 241/241, permission browser EN/AR with no serious/critical Axe findings, Prisma validation, migration SQL sanity, lint, typecheck, OpenAPI, and security check. Browser screenshots reviewed. CI validation and VPS deployment passed for `57f7621`; the live deployment header matched. Live creation of a sample role Not Run.
