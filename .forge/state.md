# Current State

Date: 2026-11-21
Status: Concurrent ticket and booking save repair deployed successfully
Risk: High

- Direct same-origin create requests replace deployment-sensitive Server Actions. Client-generated request IDs let retries recover committed records; random ticket and booking references avoid simultaneous-create collisions.
- Ticket attachment object writes complete before the database transaction, and local disk writes are asynchronous. Booking reminder scheduling errors after commit are logged without reporting a saved appointment as failed. The booking calendar initially fetches a three-month window; historical search loads on demand.
- No schema, migration, existing database row, or existing attachment was changed locally. Preserve untracked `outputs/`, `tmp/`, and `uploads/`, including the encrypted recovery copy.
- Passed: service bookings API 55/55, internal tickets API 18/18, web API client 116/116, web shell 250/250, root tests 78/78 with coverage gates, typecheck, lint, OpenAPI, security, production build, EN/AR navigation, booking suggestions, booking search browser proof, diff check.
- Read-only production baseline before release: appointments 922, complaints 4, customers 13, tasks 72, internal tickets 66. Signed-in production UAT remains Needs Human Review.
- First production deployment run 44877246025 passed validation but failed before changing containers because PostgreSQL had reached its 100-connection limit (API approximately 81, worker approximately 19). The pre-deployment dump could not connect. API and web remained healthy on revision 4a9c62d. Production compose now caps the API, worker, and migration Prisma pools at two connections each; focused deployment artifact test 8/8 passed.
- Stopped the old worker temporarily to free connections. A fresh custom-format dump `cms-auto-manual-20261121T065415Z.dump` is 1,093,177 bytes, passed `pg_restore -l`, SHA-256 `6d38617b57a3d704e9722c959b90d87821441936b9ec029ce6bf160112e68294`. Live counts after that backup: 922 appointments, 4 complaints, 13 customers, 72 tasks, 67 tickets. The worker resumed healthy with the corrected deployment.
- Corrected production run 44877805909 completed successfully at revision 879153d9f11ce88d9daa8064cba90b89fac400e1. A separate workflow dump `cms-auto-20261121T065807Z.dump` is 1,093,602 bytes, passed `pg_restore -l`, and has SHA-256 `f88afb0391b8cfbbf142bf4b1c5b5b38b79e858fcb40661e751d6db803094b24`.
- Public API health returned 200 and the matching revision; API, web, worker, Caddy, PostgreSQL, and Redis were healthy. Read-only after counts: 925 appointments, 4 complaints, 13 customers, 72 tasks, 67 tickets. PostgreSQL app connections fell from 100 to 46 (28 API, 18 worker) after the pool cap. Signed-in staff UAT remains Needs Human Review because no staff credentials were used.

---

Date: 2026-11-19
Status: Internal Officer access repair deployed successfully
Risk: High

- Cause: `/internal-tickets` included all destination-department tickets, `/tasks/today` included department recipient tasks, and My Work merged fetched department tickets without an officer ownership filter. Department membership also allowed direct ticket/task detail access.
- Internal Officer reads now require explicit requester/assignee participation for tickets and named task participation for tasks. Manager department access remains available.
- No database schema, migrations, records, or attachments were changed. Preserve untracked `outputs/`, `tmp/`, and `uploads/`, including the independent encrypted recovery copy.
- Passed: tasks API 46/46, internal tickets API 15/15, web shell 250/250, focused new regressions, typecheck, lint, OpenAPI, security, diff check.
- Passed after correcting stale manager fixture grants/expectations: task module specs 45/45 and new officer tests. Root tests 78/78 with coverage gate also passed.
- Production release `4a9c62d5d97ca66e4006fdf3d51456f5140de4e5` completed successfully in GitHub Actions run 44489612448. API health is 200 and reports that revision. Fresh pre-deployment database dump `cms-auto-20261119T084352Z.dump` passed `pg_restore -l` and SHA-256 verification.
- Live counts before/after: appointments 898/900, complaints 5/5, customers 13/13, tasks 72/72, internal tickets 54/55. No count decreased; production received new appointments/ticket during release. Signed-in Internal Officer UAT is Needs Human Review.
