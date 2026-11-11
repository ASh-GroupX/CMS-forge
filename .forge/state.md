# Current State

Date: 2026-11-11
Status: In progress — QR complaint intake
Risk: High

- Intake configuration backend slice added: versioned branch/category/phone prefix, soft-preserved member rows, Admin-only GET/PUT, optimistic conflict, target validation, configuration audit, and explicit portal fallback lookup.
- External Data API slice added: `portal-complaints:read` plus `customers:read` exposes an explicit, branch-scoped, paginated projection of QR form customer name, phone, reference, description, vehicle, and dates. The Admin API-key screen offers the resource and automatically selects the customer scope. Only creation-time portal history identifies eligible records, excluding later follow-ups to staff-created complaints.
- Passed: Prisma validate/generate, `typecheck`, `lint`, `test:api -- integrations` (54/54), `test:api -- portal` (15/15), `openapi:check`, `db:migrate:test`, `security:check`, `git diff --check`. Earlier form visual/accessibility previews passed before this API-only edit.
- Not run: live database migration and keyed HTTP pull, current screenshot review, full suite, deployment. No production SMS provider is configured; SMS is deferred per user request.
- Customer form now has required name/phone/make/model/description, optional VIN/odometer/files, editable default date, and server-owned routing defaults. Country-code UX, detailed input validation, screenshot review, Admin settings UI/QR, shared staff queue, claim, and redirect remain. No push or deployment has occurred. Preserve `tmp/` and `uploads/`.
