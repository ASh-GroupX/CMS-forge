# Default direct send for new internal ticket users

Status: Complete; release pending
Date: 2026-11-16
Risk: High
SRS: REQ-ADMIN-001, REQ-RBAC-001, METHOD-AUDIT-001

Scope: New staff users created in Admin Hub receive an explicit internal ticket rule allowing direct send without manager approval. Existing users and their saved rules retain their current behavior. The rule is created atomically with the user and CONFIG audit. No ticket route or authorization logic changes.

Proof: Passed admin API 46/46, internal tickets API 8/8, lint, typecheck, OpenAPI. Security check passed. Live new-user creation Not Run.
