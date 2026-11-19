# Restrict Internal Officer work to named assignments

Status: Completed
Date: 2026-11-19
Risk: High
SRS: REQ-RBAC-001, REQ-COLLAB-001

Scope: Repair three small access boundaries independently: internal ticket list/detail/attachment reads (controller and service plus tests), task today/board/detail reads (controller, service, access, scope helper plus tests), and My Work aggregation (page and merge helper plus test). Keep manager department access. The server session supplies role, user, and department. No schema, migration, import, deletion, or data rewrite is in scope.

Proof: Passed `npm run test:api -- tasks`, `npm run test:api -- internal-tickets`, `npm run test:web -- shell`, task and ticket module regressions, root tests/coverage, `npm run typecheck`, `npm run lint`, `npm run openapi:check`, `npm run security:check`, `git diff --check`. Production deployment passed with a verified backup and preserved record counts. Signed-in Internal Officer UAT remains Needs Human Review.
