# Rich complaint and internal-ticket external feeds

Status: Complete
Risk: High
SRS: REQ-INT-DATA-001, REQ-RBAC-001, METHOD-API-001, METHOD-AUDIT-001

Implemented and released in 2aedef2 on waleed and production. Complaint pages include creator, current owner, first acceptance, description, and a 100-event preview. A separately scoped tickets feed includes requester, current assignee, first acceptance, description, and a 100-event preview. Complete event histories are available through cursor-paginated event routes. Branch and resource scope, explicit projections, and metadata-only audit are enforced in Nest. Passed focused tests, root tests, build, lint, typecheck, security, OpenAPI, live isolated PostgreSQL HTTP proof, and EN/AR screenshot review. Independent GPT-6.1 Sol review: Accept With Conditions; requested GPT-5.6 Sol unavailable. GitHub workflow 42819848903 succeeded; public revision and health matched. Existing keys require a new tickets:read grant through a new key. Production keyed data pull is operator UAT. Preserve `tmp/` and `uploads/`.
