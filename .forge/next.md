# QR complaint intake — external customer data API

Status: Implemented locally; subsequent slices pending
Risk: High
Required model tier: GPT-6 Sol or higher
SRS: REQ-INT-DATA-001, REQ-PORTAL-001, PORTAL-SEC-001, REQ-RBAC-001, METHOD-API-001

Scope: add a distinct read-only External Data API option for QR/portal complaint customer details (name, phone, vehicle, description, reference, date). Require its own key scope, enforce stored branch scope, exclude DMS/staff-private data, document in OpenAPI, and add a selectable option in the Admin API-key UI. No SMS delivery. Preserve `tmp/` and `uploads/`.

Proof: `typecheck`, `lint`, `test:api -- integrations`, `openapi:check`, `security:check`, and a focused API key branch-scope/PII test.

Next slice: finish the customer form validation and states, then Admin settings UI and QR download with Admin Hub tile/per-user visibility. Subsequent slices add the protected redirect queue, claim, audited correction, and atomic routing. SMS delivery is deferred. Push only after the complete non-SMS flow and proof gates pass.
