# Rich complaint and internal-ticket external feeds

Status: In Progress
Risk: High
SRS: REQ-INT-DATA-001, REQ-RBAC-001, METHOD-API-001, METHOD-AUDIT-001

Extend the read-only export with operational complaint fields and staff creator/acceptor/status events, and add a separately scoped internal-ticket feed. Keep explicit projections, bounded cursor pages, branch authorization, audit metadata, and private-content exclusions. Expose tickets in the admin key workspace, OpenAPI, and operations guide. Prove, independently review, then release to waleed and production. Preserve `tmp/` and `uploads/`.
