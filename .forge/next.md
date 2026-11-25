# Search and investigation release

Status: Completed
Date: 2026-11-25
Risk: High
Model tier: T3_HIGH
SRS: REQ-SEARCH-001, WORKFLOW-MATRIX-001, REQ-COMPLAINT-001, ARCH-UI-001

Scope completed: Global search, investigation writer attribution, and stale work-queues proof repair were verified and deployed at c062e13fa34a64acd0104bcc1ad7a773c7464097.

Proof: Local search API 9/9, workflow API 103/103, web shell 255/255, API client 117/117, work-queues and complaint-workflow E2E, root tests 79/79 with coverage, typecheck, lint, OpenAPI, security, production build, visual 96/96, EN/AR screenshot review, diff check. GitHub Actions run 45568216595 attempt 2 passed Validate and Test and Deploy to VPS, including its pre-deployment backup and service/revision gates. Public health returned 200 with the exact revision, databaseConfigured true and redisConfigured true. Signed-out search returned 401; signed-out complaint and ticket pages redirected to sign-in. Signed-in production UAT remains Needs Human Review.
