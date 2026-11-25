# Current State

Date: 2026-11-25
Status: Search and investigation release verified locally; publication in progress
Risk: High (staff search scope and complaint attribution)

- Global search matches authorized customers, internal tickets, complaints, and tasks by name, number, title, description, and notes/comments. Customer/ticket results remain visible within the limit.
- Investigation Findings & Notes shows the writing employee's bilingual name from matching workflow history; older findings without a reliable author remain unattributed.
- Repaired the stale work-queues proof fixture for the current queue response and page limit.
- Passed: search API 9/9, workflow API 103/103, web shell 255/255, web API client 117/117, work-queues and complaint-workflow E2E, root tests 79/79 with coverage, typecheck, lint, OpenAPI, security, production build, visual proof 96/96, EN/AR screenshot review, diff check, development backup readiness.
- No production deployment yet. No signed-in live UAT. Untracked outputs, tmp, and uploads are outside the release.
