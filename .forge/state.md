# Current State

Date: 2026-11-25
Status: Search and investigation release deployed at c062e13fa34a64acd0104bcc1ad7a773c7464097
Risk: High (staff search scope and complaint attribution)

- Global search finds authorized customers, internal tickets, complaints, and tasks by name, number, title, description, and notes/comments. Customer/ticket results remain visible within the limit.
- Investigation Findings & Notes shows the writing employee's bilingual name from matching workflow history; older findings without a reliable author remain unattributed.
- Work-queues proof fixture repaired for the current queue response and page limit.
- Passed: local release gates (search API, workflow API, web, E2E, root tests with coverage, typecheck, lint, OpenAPI, security, build, visual screenshots), GitHub Actions production run 45568216595 attempt 2, public health/revision and unsigned access checks. First attempt failed before upload at VPS SSH reachability; retry succeeded.
- Production workflow's backup and service health gates passed. Independent restore and signed-in live UAT were Not Run.
- Untracked outputs, tmp, and uploads remain outside the release.
