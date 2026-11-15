# Current State

Date: 2026-11-15
Status: Complete locally — delegated QR settings access; not pushed
Risk: High

- A user with `USERS_MANAGE` can save a Custom Admin Hub QR complaint intake grant for an individual user of any role. The user receives the QR tile, settings page, field editor, and API read/write access only when the server session contains Custom mode plus both `admin` and `admin:portal-intake`. Admin retains access. Navigation presets do not silently grant QR access; Select All is an explicit Custom grant.
- API denials remain 403 with a SECURITY audit. Save routes retain CSRF, and existing settings/form services retain same-transaction CONFIG audit and optimistic version checks. No branch, portal public response, database, credential, or production data change.
- Passed: focused QR guard allowed/denied and CSRF metadata proof in Portal 32/32, RBAC 2/2, Admin 43/43, web shell 233/233, security check, typecheck, lint, OpenAPI check, EN desktop/AR mobile grant form browser and scoped Axe, screenshot inspection. Initial browser harness and contrast findings were repaired; reruns passed.
- Last repository release before this local task: `7052ae9` on feature, `waleed`, and `production`. Deployment and live staff UAT for this QR access change are Not Run. Preserve user `tmp/`, `uploads/`, and the previous workbook in `outputs/`.
