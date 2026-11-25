# Search and investigation release

Status: Ready for production workflow
Date: 2026-11-25
Risk: High
Model tier: T3_HIGH
SRS: REQ-SEARCH-001, WORKFLOW-MATRIX-001, REQ-COMPLAINT-001, ARCH-UI-001

Scope: Release the verified global search and investigation author display. Repair the stale work queue proof fixture within the declared one-file scope. Preserve untracked outputs, tmp, and uploads. Publish through the production branch workflow, which performs a pre-deployment backup and health/revision gates.

Proof: work-queues E2E, search API 9/9, workflow API 103/103, web shell 255/255, API client 117/117, complaint-workflow E2E, root tests 79/79 with coverage, typecheck, lint, OpenAPI, security, production build, visual 96/96, EN/AR investigation screenshots, diff check. After deployment verify workflow success, public revision and health, and signed-out access controls. Signed-in live UAT requires an authorized staff session.
