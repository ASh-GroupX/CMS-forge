# Internal officer task cards and department team tickets

Status: Completed
Date: 2026-11-23
Risk: High
SRS: REQ-RBAC-001, REQ-COLLAB-001, ARCH-UI-001, METHOD-TEST-001

Scope: Preserve selected user recipients when creating a task; show a receiving department's team-assigned ticket to its officers in API lists, detail, and My Work cards. Keep named-only access to coworker-assigned tickets and deny other departments.

Proof: Internal-ticket API 19/19, tasks API 46/46, web shell 251/251, web API client 117/117, root tests 79/79 with coverage, typecheck, lint, OpenAPI, security, production build, visual 96 routes, accessibility 24 routes, permissions browser proof.
