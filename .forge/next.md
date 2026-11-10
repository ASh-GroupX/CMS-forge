# External data API — admin key workspace

Status: Ready for Release
Risk: High
SRS: REQ-INT-DATA-001, REQ-RBAC-001, NFR-SEC-002, ARCH-API-001, ARCH-INTEGRATION-001, METHOD-API-001, METHOD-AUDIT-001

The user wants key management in the existing admin hub, without a separate password/Postman flow. Implement a localized EN/AR workspace using the current staff session and CSRF, with backend-enforced ADMIN and INTEGRATIONS_MANAGE. Show key metadata, allow scoped creation and revocation, display the new secret only once in browser memory, provide a copyable API request and a safe test action that reports status/count without showing customer records. Preserve `tmp/` and `uploads/`.

Implemented: admin hub navigation and access rule, typed server actions/client, workspace page and components, EN/AR copy, focused tests. The shadcn CLI generated the alert primitive. Passed: production build, typecheck, lint, OpenAPI check, web shell 231/231, API-client 109/109, accessibility proof for 24 previews, focused tests 6/6, and a local authenticated Playwright create/test/revoke flow with EN/AR screenshots and zero serious/critical axe findings on this screen. Independent GPT-6 Sol re-review: Accept With Conditions; preferred named reviewer tier unavailable.

Next: commit, push to waleed, merge into production per the user's existing authorization, then verify workflow success, public revision, health and admin route. No production key can be created without an authenticated administrator session. Do not bypass backend authorization or issue a key through another person's session. Preserve `tmp/` and `uploads/`.
