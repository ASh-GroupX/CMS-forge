# Current State

Date: 2026-11-21
Status: Concurrent ticket and booking save repair verified locally; production release pending
Risk: High

- Direct same-origin create requests replace deployment-sensitive Server Actions. Client-generated request IDs let retries recover committed records; random ticket and booking references avoid simultaneous-create collisions.
- Ticket attachment object writes complete before the database transaction, and local disk writes are asynchronous. Booking reminder scheduling errors after commit are logged without reporting a saved appointment as failed. The booking calendar initially fetches a three-month window; historical search loads on demand.
- No schema, migration, existing database row, or existing attachment was changed locally. Preserve untracked `outputs/`, `tmp/`, and `uploads/`, including the encrypted recovery copy.
- Passed: service bookings API 55/55, internal tickets API 18/18, web API client 116/116, web shell 250/250, root tests 78/78 with coverage gates, typecheck, lint, OpenAPI, security, production build, EN/AR navigation, booking suggestions, booking search browser proof, diff check.
- Read-only production baseline before release: appointments 922, complaints 4, customers 13, tasks 72, internal tickets 66. Signed-in production UAT remains Needs Human Review.

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
